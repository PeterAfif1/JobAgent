const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function buildBody({ jobUrl, jobDescription, resumeText, threshold, maxIterations }) {
  const body = { resume_text: resumeText };
  if (jobUrl) body.job_url = jobUrl;
  if (jobDescription) body.job_description = jobDescription;
  if (threshold != null && threshold !== "") body.threshold = Number(threshold);
  if (maxIterations != null && maxIterations !== "")
    body.max_iterations = Number(maxIterations);
  return body;
}

async function errorDetail(resp) {
  let detail = `Request failed (${resp.status})`;
  try {
    const data = await resp.json();
    if (data.detail) detail = data.detail;
  } catch {
    /* ignore non-JSON error bodies */
  }
  return detail;
}

/**
 * Non-streaming call. Returns the TailorResponse JSON.
 */
export async function postTailor(params) {
  const resp = await fetch(`${API_URL}/tailor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildBody(params)),
  });
  if (!resp.ok) throw new Error(await errorDetail(resp));
  return resp.json();
}

/**
 * Streaming call. Opens POST /tailor/stream and invokes onEvent(event) for each
 * Server-Sent Event as the agent runs. Resolves when the stream ends.
 */
export async function streamTailor(params, onEvent) {
  const resp = await fetch(`${API_URL}/tailor/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildBody(params)),
  });

  if (!resp.ok || !resp.body) throw new Error(await errorDetail(resp));

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line.
    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      try {
        onEvent(JSON.parse(dataLine.slice(5).trim()));
      } catch {
        /* ignore malformed frames */
      }
    }
  }
}
