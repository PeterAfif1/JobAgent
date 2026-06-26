"""Pydantic request/response models for the API."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class TailorRequest(BaseModel):
    job_url: str = Field(..., description="URL of the job posting to scrape.")
    resume_text: str = Field(..., min_length=1, description="The user's resume.")
    threshold: Optional[int] = Field(
        None, ge=0, le=100, description="Target fit score; loop stops once met."
    )
    max_iterations: Optional[int] = Field(
        None, ge=1, le=10, description="Max rewrite passes before giving up."
    )


class IterationOut(BaseModel):
    iteration: int
    fit_score: int
    reasoning: str


class TailorResponse(BaseModel):
    fit_score: int
    score_reasoning: str
    missing_keywords: list[str]
    weak_bullets: list[str]
    iterations: int
    history: list[IterationOut]
    final_resume: str
    error: Optional[str] = None
