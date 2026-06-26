"""Node: assemble the final tailored resume (terminal node).

STUB — for now just promotes the working copy. If scraping failed, the error
is already in state and the UI can surface it.
"""

from __future__ import annotations

from ..state import JobAgentState


def finalize(state: JobAgentState) -> dict:
    final = state.get("current_resume") or state.get("resume_text", "")
    return {"final_resume": final}
