"""Pydantic request/response models for the API."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, model_validator


class TailorRequest(BaseModel):
    job_url: Optional[str] = Field(
        None, description="URL of the job posting to scrape."
    )
    job_description: Optional[str] = Field(
        None, description="Pasted job description, used instead of scraping a URL."
    )
    resume_text: str = Field(..., min_length=1, description="The user's resume.")
    threshold: Optional[int] = Field(
        None, ge=0, le=100, description="Target fit score; loop stops once met."
    )
    max_iterations: Optional[int] = Field(
        None, ge=1, le=10, description="Max rewrite passes before giving up."
    )

    @model_validator(mode="after")
    def require_url_or_description(self) -> "TailorRequest":
        if not (self.job_url and self.job_url.strip()) and not (
            self.job_description and self.job_description.strip()
        ):
            raise ValueError("Provide either job_url or job_description.")
        return self


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
