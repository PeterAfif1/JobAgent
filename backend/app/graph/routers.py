"""Router functions for the conditional edges.

A router reads the current state and returns a string key. `builder.py` maps
that key to the next node. These two functions are what make the graph
branching + cyclic rather than a linear chain.
"""

from __future__ import annotations

from .state import JobAgentState


def route_after_scrape(state: JobAgentState) -> str:
    """If scraping failed, skip straight to finalize (surface the error)."""
    if state.get("error") or not state.get("jd_text"):
        return "finalize"
    return "score_fit"


def route_after_score(state: JobAgentState) -> str:
    """The agentic loop decision.

    Stop (finalize) when the resume is good enough OR we've run out of
    iterations. Otherwise keep improving via analyze_gaps -> rewrite_bullets.
    """
    threshold = state.get("threshold", 80)
    max_iterations = state.get("max_iterations", 3)
    fit_score = state.get("fit_score", 0)
    iterations = state.get("iterations", 0)

    if fit_score >= threshold or iterations >= max_iterations:
        return "finalize"
    return "analyze_gaps"
