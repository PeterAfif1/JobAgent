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
      <header className="header">
        <h1>JobAgent</h1>
        <p>Paste a job link and your resume. An AI agent scores the fit, then
          loops — analyzing gaps and rewriting weak bullets — until it clears
          your target score.</p>
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
