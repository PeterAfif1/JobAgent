"""FastAPI entrypoint: exposes the JobAgent graph over HTTP."""

from __future__ import annotations

import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .config import get_settings
from .graph import graph
from .schemas import TailorRequest, TailorResponse

settings = get_settings()

app = FastAPI(title="JobAgent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


def _build_initial_state(req: TailorRequest) -> dict:
    return {
        "job_url": req.job_url or "",
        # A pasted description seeds jd_text directly; scrape_jd then skips
        # fetching and the graph proceeds straight to scoring.
        "jd_text": (req.job_description or "").strip(),
        "resume_text": req.resume_text,
        "current_resume": req.resume_text,
        "iterations": 0,
        "threshold": req.threshold or settings.default_threshold,
        "max_iterations": req.max_iterations or settings.default_max_iterations,
    }


@app.post("/tailor", response_model=TailorResponse)
async def tailor(req: TailorRequest) -> TailorResponse:
    initial_state = _build_initial_state(req)

    try:
        # Generous recursion_limit so the loop guard (max_iterations), not the
        # framework, decides when to stop.
        final_state = await graph.ainvoke(initial_state, {"recursion_limit": 50})
    except Exception as exc:  # surface a clean 500 rather than a stack trace
        raise HTTPException(status_code=500, detail=f"Agent failed: {exc}") from exc

    return TailorResponse(
        fit_score=final_state.get("fit_score", 0),
        score_reasoning=final_state.get("score_reasoning", ""),
        missing_keywords=final_state.get("missing_keywords", []),
        weak_bullets=final_state.get("weak_bullets", []),
        iterations=final_state.get("iterations", 0),
        history=final_state.get("history", []),
        final_resume=final_state.get("final_resume", ""),
        error=final_state.get("error"),
    )


def _sse(event: dict) -> str:
    """Format one Server-Sent Event frame."""
    return f"data: {json.dumps(event)}\n\n"


def _node_payload(node: str, update: dict) -> dict:
    """Curate the per-node update into a small, frontend-friendly event."""
    if node == "scrape_jd":
        return {
            "jd_chars": len(update.get("jd_text", "") or ""),
            "error": update.get("error"),
        }
    if node == "score_fit":
        history = update.get("history") or [{}]
        return {
            "fit_score": update.get("fit_score"),
            "iteration": history[-1].get("iteration"),
            "score_reasoning": update.get("score_reasoning"),
        }
    if node == "analyze_gaps":
        return {
            "missing_keywords": update.get("missing_keywords", []),
            "weak_bullets": len(update.get("weak_bullets", []) or []),
        }
    if node == "rewrite_bullets":
        return {"iterations": update.get("iterations")}
    return {}


@app.post("/tailor/stream")
async def tailor_stream(req: TailorRequest) -> StreamingResponse:
    """Same agent run as /tailor, but streams a node-by-node event log over SSE
    so the UI can show the graph working in real time."""
    initial_state = _build_initial_state(req)

    async def event_stream():
        # Accumulate node updates so we can emit the full result at the end.
        acc = {
            "fit_score": 0,
            "score_reasoning": "",
            "missing_keywords": [],
            "weak_bullets": [],
            "iterations": 0,
            "history": [],
            "final_resume": "",
            "error": None,
        }
        try:
            yield _sse({"type": "start"})
            async for chunk in graph.astream(
                initial_state, {"recursion_limit": 50}, stream_mode="updates"
            ):
                for node, update in chunk.items():
                    if not update:
                        continue
                    for key, value in update.items():
                        if key == "history":
                            acc["history"] = acc["history"] + (value or [])
                        elif key in acc:
                            acc[key] = value
                    yield _sse(
                        {"type": "node", "node": node, "data": _node_payload(node, update)}
                    )
            yield _sse({"type": "complete", "result": acc})
        except Exception as exc:  # stream the error instead of dropping the connection
            yield _sse({"type": "error", "detail": f"Agent failed: {exc}"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
