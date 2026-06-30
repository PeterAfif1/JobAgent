import { Fragment, useEffect, useState } from "react";

function scoreColor(score) {
  if (score >= 80) return "#34d399"; // emerald
  if (score >= 60) return "#fbbf24"; // amber
  return "#f87171"; // red
}

function SectionLabel({ children }) {
  return (
    <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">
      {children}
    </h3>
  );
}

function ScoreGauge({ score }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const duration = 900;
    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setVal(Math.round(eased * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - val / 100);
  const color = scoreColor(score);

  return (
    <div className="relative h-32 w-32 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-semibold" style={{ color }}>
          {val}
        </span>
        <span className="font-mono text-xs text-muted">/ 100</span>
      </div>
    </div>
  );
}

export default function ResultView({ result }) {
  const [copied, setCopied] = useState(false);

  const {
    fit_score,
    score_reasoning,
    missing_keywords = [],
    history = [],
    final_resume = "",
    error,
  } = result;

  async function copyResume() {
    try {
      await navigator.clipboard.writeText(final_resume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function downloadResume() {
    const blob = new Blob([final_resume], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tailored-resume.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const btn =
    "rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent/60 disabled:opacity-40";

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="card border-[#7a5b1e] text-[#e8b75c]">
          <strong className="font-semibold">Heads up:</strong> {error}
        </div>
      )}

      {/* score gauge */}
      <div className="card flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <ScoreGauge score={fit_score} />
        <div>
          <SectionLabel>Final fit score</SectionLabel>
          <p className="leading-relaxed text-muted">
            {score_reasoning || "No reasoning returned."}
          </p>
        </div>
      </div>

      {/* score progression */}
      {history.length > 0 && (
        <div className="card">
          <SectionLabel>How the score evolved</SectionLabel>
          <div className="flex flex-wrap items-center gap-2">
            {history.map((h, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <span className="font-mono text-line-strong">→</span>
                )}
                <div className="rounded-lg border border-line bg-bg px-3 py-2 text-center">
                  <div className="font-mono text-[0.7rem] uppercase tracking-wide text-muted">
                    {h.iteration === 0 ? "initial" : `pass ${h.iteration}`}
                  </div>
                  <div
                    className="font-mono text-xl font-semibold"
                    style={{ color: scoreColor(h.fit_score) }}
                  >
                    {h.fit_score}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {/* keywords */}
      {missing_keywords.length > 0 && (
        <div className="card">
          <SectionLabel>Keywords the agent worked in</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {missing_keywords.map((kw, i) => (
              <span
                key={i}
                className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-sm text-accent"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* tailored resume */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Tailored resume</SectionLabel>
          <div className="flex gap-2">
            <button className={btn} onClick={copyResume} disabled={!final_resume}>
              {copied ? "Copied" : "Copy"}
            </button>
            <button className={btn} onClick={downloadResume} disabled={!final_resume}>
              Download
            </button>
          </div>
        </div>
        <pre className="max-h-[480px] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-bg p-4 font-mono text-[0.8rem] leading-relaxed text-ink/90">
          {final_resume}
        </pre>
      </div>
    </div>
  );
}
