const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Calls the backend agent. Returns the TailorResponse JSON.
 * Throws an Error with a readable message on failure.
 */
export async function postTailor({
  jobUrl,
  jobDescription,
  resumeText,
  threshold,
  maxIterations,
}) {
  const body = { resume_text: resumeText };
  if (jobUrl) body.job_url = jobUrl;
  if (jobDescription) body.job_description = jobDescription;
  if (threshold != null && threshold !== "") body.threshold = Number(threshold);
  if (maxIterations != null && maxIterations !== "")
    body.max_iterations = Number(maxIterations);

  const resp = await fetch(`${API_URL}/tailor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    let detail = `Request failed (${resp.status})`;
    try {
      const data = await resp.json();
      if (data.detail) detail = data.detail;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(detail);
  }

  return resp.json();
}
