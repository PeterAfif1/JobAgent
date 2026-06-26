"""Assemble and compile the JobAgent StateGraph.

    START -> scrape_jd -> (route_after_scrape) -> score_fit | finalize
    score_fit -> (route_after_score) -> analyze_gaps | finalize
    analyze_gaps -> rewrite_bullets -> score_fit   (loop back)
    finalize -> END

The two conditional edges make this branching + cyclic, not a linear chain.
"""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from .nodes import analyze_gaps, finalize, rewrite_bullets, score_fit, scrape_jd
from .routers import route_after_scrape, route_after_score
from .state import JobAgentState


def build_graph():
    builder = StateGraph(JobAgentState)

    # nodes
    builder.add_node("scrape_jd", scrape_jd)
    builder.add_node("score_fit", score_fit)
    builder.add_node("analyze_gaps", analyze_gaps)
    builder.add_node("rewrite_bullets", rewrite_bullets)
    builder.add_node("finalize", finalize)

    # entry
    builder.add_edge(START, "scrape_jd")

    # conditional: did scraping succeed?
    builder.add_conditional_edges(
        "scrape_jd",
        route_after_scrape,
        {"score_fit": "score_fit", "finalize": "finalize"},
    )

    # conditional: good enough / out of iterations, or keep improving?
    builder.add_conditional_edges(
        "score_fit",
        route_after_score,
        {"analyze_gaps": "analyze_gaps", "finalize": "finalize"},
    )

    # the improvement loop
    builder.add_edge("analyze_gaps", "rewrite_bullets")
    builder.add_edge("rewrite_bullets", "score_fit")

    # exit
    builder.add_edge("finalize", END)

    return builder.compile()


# Module-level compiled graph the API imports and invokes.
graph = build_graph()
