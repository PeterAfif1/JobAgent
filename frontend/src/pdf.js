// Lazy-loaded PDF text extraction. pdf.js (and its worker) are only fetched
// the first time a user actually uploads a PDF, keeping the initial bundle small.

let pdfjsPromise;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

/**
 * Extract plain text from a PDF File. Returns the text (possibly empty for
 * scanned/image-only PDFs, which have no text layer).
 */
export async function extractPdfText(file) {
  const pdfjs = await getPdfjs();
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;

  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }

  return pages.join("\n").replace(/[ \t]+/g, " ").trim();
}
