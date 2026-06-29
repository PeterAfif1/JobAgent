import { useState } from "react";

export default function TailorForm({ onSubmit, loading }) {
  const [mode, setMode] = useState("url"); // "url" | "paste"
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [threshold, setThreshold] = useState(80);
  const [maxIterations, setMaxIterations] = useState(3);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      jobUrl: mode === "url" ? jobUrl : "",
      jobDescription: mode === "paste" ? jobDescription : "",
      resumeText,
      threshold,
      maxIterations,
    });
  }

  const hasJob =
    mode === "url" ? jobUrl.trim() : jobDescription.trim();
  const canSubmit = hasJob && resumeText.trim() && !loading;

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="mode-toggle">
        <button
          type="button"
          className={mode === "url" ? "active" : ""}
          onClick={() => setMode("url")}
        >
          From URL
        </button>
        <button
          type="button"
          className={mode === "paste" ? "active" : ""}
          onClick={() => setMode("paste")}
        >
          Paste description
        </button>
      </div>

      {mode === "url" ? (
        <label className="field">
          <span>Job posting URL</span>
          <input
            type="url"
            placeholder="https://company.com/careers/role"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
          />
          <small className="hint">
            JavaScript-rendered boards (Ashby, Greenhouse, Lever, Workday) often
            won't scrape — use Paste description for those.
          </small>
        </label>
      ) : (
        <label className="field">
          <span>Job description</span>
          <textarea
            rows={8}
            placeholder="Paste the full job description here…"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </label>
      )}

      <label className="field">
        <span>Your resume</span>
        <textarea
          rows={12}
          placeholder="Paste your resume text here…"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          required
        />
      </label>

      <button
        type="button"
        className="link-btn"
        onClick={() => setShowAdvanced((s) => !s)}
      >
        {showAdvanced ? "▾ Advanced" : "▸ Advanced"}
      </button>

      {showAdvanced && (
        <div className="advanced">
          <label className="field">
            <span>Target fit score</span>
            <input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Max rewrite passes</span>
            <input
              type="number"
              min={1}
              max={10}
              value={maxIterations}
              onChange={(e) => setMaxIterations(e.target.value)}
            />
          </label>
        </div>
      )}

      <button type="submit" className="primary-btn" disabled={!canSubmit}>
        {loading ? "Tailoring…" : "Tailor my resume"}
      </button>
    </form>
  );
}
