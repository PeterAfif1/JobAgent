"""FastAPI entrypoint: exposes the JobAgent graph over HTTP."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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


@app.post("/tailor", response_model=TailorResponse)
async def tailor(req: TailorRequest) -> TailorResponse:
    initial_state = {
        "job_url": req.job_url,
        "resume_text": req.resume_text,
        "current_resume": req.resume_text,
        "iterations": 0,
        "threshold": req.threshold or settings.default_threshold,
        "max_iterations": req.max_iterations or settings.default_max_iterations,
    }

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
