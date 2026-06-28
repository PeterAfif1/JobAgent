import { useState } from "react";

function scoreClass(score) {
  if (score >= 80) return "good";
  if (score >= 60) return "ok";
  return "low";
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

  return (
    <div className="results">
      {error && (
        <div className="card banner warn">
          <strong>Heads up:</strong> {error}
        </div>
      )}

      <div className="card score-card">
        <div className={`score-badge ${scoreClass(fit_score)}`}>
          <span className="score-num">{fit_score}</span>
          <span className="score-den">/100</span>
        </div>
        <div className="score-text">
          <h2>Final fit score</h2>
          <p>{score_reasoning || "No reasoning returned."}</p>
        </div>
      </div>

      {history.length > 0 && (
        <div className="card">
          <h3>How the score evolved</h3>
          <ol className="timeline">
            {history.map((h, i) => (
              <li key={i} className="timeline-item">
                <span className="timeline-pass">
                  {h.iteration === 0 ? "Initial" : `Pass ${h.iteration}`}
                </span>
                <span className={`timeline-score ${scoreClass(h.fit_score)}`}>
                  {h.fit_score}
                </span>
                <span className="timeline-reason">{h.reasoning}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {missing_keywords.length > 0 && (
        <div className="card">
          <h3>Keywords the agent worked in</h3>
          <div className="chips">
            {missing_keywords.map((kw, i) => (
              <span key={i} className="chip">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="resume-head">
          <h3>Tailored resume</h3>
          <button className="copy-btn" onClick={copyResume} disabled={!final_resume}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <pre className="resume-text">{final_resume}</pre>
      </div>
    </div>
  );
}
