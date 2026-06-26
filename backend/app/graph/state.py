"""Shared state for the JobAgent graph.

Every node receives this dict and returns a partial dict of updates. By default
LangGraph overwrites a key with the returned value; `history` uses the
`operator.add` reducer so each loop pass appends rather than overwrites.
"""

from __future__ import annotations

import operator
from typing import Annotated, Optional, TypedDict


class IterationRecord(TypedDict):
    """One pass through the score/analyze/rewrite loop, for the UI timeline."""

    iteration: int
    fit_score: int
    reasoning: str


class JobAgentState(TypedDict, total=False):
    # --- inputs ---
    job_url: str
    resume_text: str          # original resume, never mutated
    threshold: int            # target fit score (default applied at invoke)
    max_iterations: int       # loop guard

    # --- produced by scrape_jd ---
    jd_text: str
    error: Optional[str]

    # --- working copy, improved each loop by rewrite_bullets ---
    current_resume: str

    # --- produced by score_fit ---
    fit_score: int
    score_reasoning: str

    # --- produced by analyze_gaps ---
    missing_keywords: list[str]
    weak_bullets: list[str]

    # --- loop bookkeeping ---
    iterations: int
    history: Annotated[list[IterationRecord], operator.add]

    # --- produced by finalize ---
    final_resume: str
