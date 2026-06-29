import { useState } from "react";
import TailorForm from "./components/TailorForm.jsx";
import ResultView from "./components/ResultView.jsx";
import { postTailor } from "./api.js";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(values) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await postTailor(values);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="mb-9">
        <div className="flex items-center gap-2 font-mono text-sm text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
          <span className="tracking-tight text-ink">JobAgent</span>
          <span className="text-line-strong">/</span>
          <span>LangGraph resume agent</span>
        </div>

        <h1 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          Tailor your resume to any job, automatically.
        </h1>

        <p className="mt-3 max-w-xl leading-relaxed text-muted">
          Paste a job link and your resume. The agent scores the fit, then loops
          through gap analysis and bullet rewrites until it clears the target
          score you set.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
          {["scrape", "score", "analyze", "rewrite", "re-score"].map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              {i > 0 && <span className="text-line-strong">→</span>}
              <span className="rounded-md border border-line bg-surface px-2 py-1">
                {step}
              </span>
            </span>
          ))}
        </div>
      </header>

      <main className="layout">
        <TailorForm onSubmit={handleSubmit} loading={loading} />

        {loading && (
          <div className="card status">
            <div className="spinner" />
            <p>Scraping the job description, scoring, and rewriting… this can
              take up to a minute.</p>
          </div>
        )}

        {error && (
          <div className="card banner error">
            <strong>Something went wrong:</strong> {error}
          </div>
        )}

        {result && !loading && <ResultView result={result} />}
      </main>
    </div>
  );
}
