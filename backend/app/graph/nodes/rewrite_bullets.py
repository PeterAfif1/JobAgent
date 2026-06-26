"""Node: rewrite weak bullets with JD-specific language.

Uses GPT-4o. Returns the full updated resume and increments the loop counter;
the new current_resume flows back to score_fit for re-scoring.
"""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from ...llm import reasoning_llm
from ..state import JobAgentState


class RewrittenResume(BaseModel):
    resume: str = Field(
        description="The full resume text with weak bullets rewritten. Preserve "
        "all sections, formatting, and untouched content exactly."
    )


_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert resume writer. Rewrite ONLY the weak bullets "
            "listed, making them specific, quantified, and aligned to the job "
            "description. Naturally incorporate the missing keywords WHERE "
            "TRUTHFUL given the rest of the resume — never fabricate experience, "
            "employers, or metrics. Return the COMPLETE resume with the rewrites "
            "applied in place; leave every other line unchanged.",
        ),
        (
            "human",
            "JOB DESCRIPTION:\n{jd}\n\n"
            "MISSING KEYWORDS TO WEAVE IN (only if truthful):\n{keywords}\n\n"
            "WEAK BULLETS TO REWRITE:\n{weak}\n\n"
            "CURRENT RESUME:\n{resume}",
        ),
    ]
)


def rewrite_bullets(state: JobAgentState) -> dict:
    resume = state.get("current_resume") or state.get("resume_text", "")
    jd = state.get("jd_text", "")
    keywords = state.get("missing_keywords", [])
    weak = state.get("weak_bullets", [])
    iterations = state.get("iterations", 0)

    # Nothing flagged to improve — avoid a no-op LLM call, just bump the counter
    # so the loop guard still advances.
    if not weak and not keywords:
        return {"current_resume": resume, "iterations": iterations + 1}

    chain = _PROMPT | reasoning_llm().with_structured_output(RewrittenResume)
    result: RewrittenResume = chain.invoke(
        {
            "jd": jd,
            "keywords": "\n".join(f"- {k}" for k in keywords) or "(none)",
            "weak": "\n".join(f"- {b}" for b in weak) or "(none)",
            "resume": resume,
        }
    )

    return {
        "current_resume": result.resume,
        "iterations": iterations + 1,
    }
