import { useEffect, useRef } from "react";

const STAGES = [
  { key: "scrape_jd", label: "Scrape JD" },
  { key: "score_fit", label: "Score fit" },
  { key: "analyze_gaps", label: "Analyze gaps" },
  { key: "rewrite_bullets", label: "Rewrite bullets" },
  { key: "finalize", label: "Finalize" },
];

function describe(ev) {
  const d = ev.data || {};
  switch (ev.node) {
    case "scrape_jd":
      return d.error
        ? `Scrape issue, continuing with what we have`
        : `Scraped job description (${(d.jd_chars || 0).toLocaleString()} chars)`;
    case "score_fit":
      return `Scored ${d.fit_score}/100 (pass ${d.iteration})`;
    case "analyze_gaps": {
      const kw = d.missing_keywords?.length ?? 0;
      const wb = d.weak_bullets ?? 0;
      return `Found ${kw} missing keyword${kw === 1 ? "" : "s"}, ${wb} weak bullet${
        wb === 1 ? "" : "s"
      }`;
    }
    case "rewrite_bullets":
      return `Rewrote bullets, starting pass ${d.iterations}`;
    case "finalize":
      return `Assembled the tailored resume`;
    default:
      return ev.node;
  }
}

function StatusDot({ state }) {
  if (state === "done") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-accent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" />
    );
  }
  return <span className="h-5 w-5 rounded-full border-2 border-line" />;
}

export default function AgentProgress({ events }) {
  const logRef = useRef(null);
  const nodeEvents = events.filter((e) => e.type === "node");

  // Per-stage run counts (the middle stages repeat across loop passes).
  const counts = {};
  for (const e of nodeEvents) counts[e.node] = (counts[e.node] || 0) + 1;

  const activeNode = nodeEvents.length
    ? nodeEvents[nodeEvents.length - 1].node
    : null;

  const lastScore = [...nodeEvents].reverse().find((e) => e.node === "score_fit");
  const liveScore = lastScore?.data?.fit_score;
  const livePass = lastScore?.data?.iteration;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events.length]);

  function stageState(key) {
    if (key === activeNode) return "active";
    if (counts[key]) return "done";
    return "pending";
  }

  return (
    <div className="card">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
          <span className="font-mono text-sm text-ink">agent running</span>
        </div>
        {liveScore != null && (
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl font-semibold text-ink">{liveScore}</span>
            <span className="text-sm text-muted">/100</span>
            <span className="ml-2 text-xs text-muted">pass {livePass}</span>
          </div>
        )}
      </div>

      {/* pipeline */}
      <ol className="mb-5 space-y-3">
        {STAGES.map((stage) => {
          const state = stageState(stage.key);
          return (
            <li key={stage.key} className="flex items-center gap-3">
              <StatusDot state={state} />
              <span
                className={`text-sm transition-colors ${
                  state === "pending" ? "text-muted" : "text-ink"
                }`}
              >
                {stage.label}
              </span>
              {counts[stage.key] > 1 && (
                <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-muted">
                  ×{counts[stage.key]}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* live run log */}
      <div
        ref={logRef}
        className="max-h-40 overflow-y-auto rounded-lg border border-line bg-bg p-3 font-mono text-xs leading-relaxed"
      >
        {nodeEvents.length === 0 ? (
          <span className="text-muted">starting…</span>
        ) : (
          nodeEvents.map((e, i) => (
            <div key={i} className="text-muted">
              <span className="text-line-strong">{"› "}</span>
              <span className="text-ink/90">{describe(e)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
