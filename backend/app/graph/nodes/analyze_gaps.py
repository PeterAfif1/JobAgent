"""Node: identify missing keywords and weak bullets vs the JD.

Uses GPT-4o with structured output.
"""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from ...llm import reasoning_llm
from ..state import JobAgentState


class GapAnalysis(BaseModel):
    missing_keywords: list[str] = Field(
        default_factory=list,
        description="Important skills/terms in the JD that are absent or weak "
        "in the resume.",
    )
    weak_bullets: list[str] = Field(
        default_factory=list,
        description="Verbatim resume bullet points that are vague, generic, or "
        "fail to demonstrate JD-relevant impact and should be rewritten.",
    )


_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert resume coach. Compare the resume to the job "
            "description and find (1) high-value keywords/skills the JD wants "
            "that the resume is missing or underplaying, and (2) the specific "
            "existing resume bullets that are weakest relative to this JD. "
            "Quote weak bullets exactly as they appear. Do not invent bullets.",
        ),
        ("human", "JOB DESCRIPTION:\n{jd}\n\nRESUME:\n{resume}"),
    ]
)


def analyze_gaps(state: JobAgentState) -> dict:
    resume = state.get("current_resume") or state.get("resume_text", "")
    jd = state.get("jd_text", "")

    chain = _PROMPT | reasoning_llm().with_structured_output(GapAnalysis)
    result: GapAnalysis = chain.invoke({"jd": jd, "resume": resume})

    return {
        "missing_keywords": result.missing_keywords,
        "weak_bullets": result.weak_bullets,
    }
