import { useState } from "react";

const EXAMPLE_JD = `Frontend Engineer (React / TypeScript)

We are looking for a frontend engineer to own key parts of our web app. You will:
- Build and maintain features in React and TypeScript
- Lead work on our design system and shared component library
- Improve performance, with a focus on Core Web Vitals
- Set up and maintain CI/CD pipelines for fast, safe deploys
- Collaborate closely with design and backend teams

Requirements: 3+ years with React, strong TypeScript, experience with
accessibility, testing, and modern build tooling.`;

const EXAMPLE_RESUME = `Marcus Trujillo
Frontend Developer | marcus.trujillo@example.com

EXPERIENCE
Frontend Developer, Brightline Apps (2021-present)
- Worked on the company web app using React.
- Helped build reusable UI components for the team.
- Fixed performance issues on key pages.

Web Developer, Contract (2019-2021)
- Built marketing sites for small businesses.
- Set up deployment for a few client projects.

SKILLS
JavaScript, React, HTML, CSS, Git`;

const labelCls = "mb-2 block text-sm font-medium text-muted";
const inputCls =
  "w-full rounded-lg border border-line bg-bg px-3.5 py-2.5 text-ink placeholder:text-muted/50 outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/15";

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

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

  function fillExample() {
    setMode("paste");
    setJobDescription(EXAMPLE_JD);
    setResumeText(EXAMPLE_RESUME);
  }

  const hasJob = mode === "url" ? jobUrl.trim() : jobDescription.trim();
  const canSubmit = hasJob && resumeText.trim() && !loading;

  const segBtn = (active) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      active ? "bg-surface-2 text-ink shadow-sm" : "text-muted hover:text-ink"
    }`;

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          New run
        </span>
        <button
          type="button"
          className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          onClick={fillExample}
        >
          Try an example
        </button>
      </div>

      {/* segmented control: URL vs paste */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-line bg-bg p-1">
        <button type="button" className={segBtn(mode === "url")} onClick={() => setMode("url")}>
          From URL
        </button>
        <button
          type="button"
          className={segBtn(mode === "paste")}
          onClick={() => setMode("paste")}
        >
          Paste description
        </button>
      </div>

      {mode === "url" ? (
        <div className="mb-4">
          <label className={labelCls} htmlFor="job-url">
            Job posting URL
          </label>
          <input
            id="job-url"
            type="url"
            className={inputCls}
            placeholder="https://company.com/careers/role"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
          />
          <p className="mt-2 text-xs leading-relaxed text-muted/80">
            JavaScript-rendered boards (Ashby, Greenhouse, Lever, Workday) often
            won't scrape, so use Paste description for those.
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <label className={labelCls} htmlFor="job-desc">
            Job description
          </label>
          <textarea
            id="job-desc"
            rows={8}
            className={`${inputCls} resize-y`}
            placeholder="Paste the full job description here…"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
      )}

      <div className="mb-4">
        <label className={labelCls} htmlFor="resume">
          Your resume
        </label>
        <textarea
          id="resume"
          rows={12}
          className={`${inputCls} resize-y`}
          placeholder="Paste your resume text here…"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          required
        />
      </div>

      <button
        type="button"
        className="mb-1 flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        onClick={() => setShowAdvanced((s) => !s)}
        aria-expanded={showAdvanced}
      >
        <Chevron open={showAdvanced} />
        Advanced
      </button>

      {showAdvanced && (
        <div className="mb-4 mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="threshold">
              Target fit score
            </label>
            <input
              id="threshold"
              type="number"
              min={0}
              max={100}
              className={`${inputCls} font-mono`}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="max-iter">
              Max rewrite passes
            </label>
            <input
              id="max-iter"
              type="number"
              min={1}
              max={10}
              className={`${inputCls} font-mono`}
              value={maxIterations}
              onChange={(e) => setMaxIterations(e.target.value)}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-bg transition hover:bg-accent-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canSubmit}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg/30 border-t-bg" />
        )}
        {loading ? "Tailoring…" : "Tailor my resume"}
      </button>
    </form>
  );
}
