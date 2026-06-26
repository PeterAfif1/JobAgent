"""Node: score current_resume against jd_text (0-100) with reasoning.

Uses GPT-4o-mini with structured output. Appends a record to `history` each
pass so the UI can show the score improving across loop iterations.
"""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from ...llm import scoring_llm
from ..state import JobAgentState


class FitScore(BaseModel):
    score: int = Field(description="Resume-to-JD fit, 0-100.", ge=0, le=100)
    reasoning: str = Field(description="2-3 sentences on what drove the score.")


_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a precise technical recruiter. Score how well the resume "
            "fits the job description from 0 to 100, where 100 is a perfect "
            "match. Judge on required skills, keywords, seniority, and relevant "
            "impact. Be strict and consistent.",
        ),
        (
            "human",
            "JOB DESCRIPTION:\n{jd}\n\nRESUME:\n{resume}\n\n"
            "Return the fit score and a short justification.",
        ),
    ]
)


def score_fit(state: JobAgentState) -> dict:
    resume = state.get("current_resume") or state.get("resume_text", "")
    jd = state.get("jd_text", "")
    iterations = state.get("iterations", 0)

    chain = _PROMPT | scoring_llm().with_structured_output(FitScore)
    result: FitScore = chain.invoke({"jd": jd, "resume": resume})

    return {
        "current_resume": resume,
        "fit_score": result.score,
        "score_reasoning": result.reasoning,
        "history": [
            {
                "iteration": iterations,
                "fit_score": result.score,
                "reasoning": result.reasoning,
            }
        ],
    }
