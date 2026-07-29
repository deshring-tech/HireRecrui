// Shared resume/document text extraction. Used by the single-file upload route
// and the bulk resume ingestion route.

export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const name = filename.toLowerCase();

  if (name.endsWith(".pdf")) {
    // unpdf ships a serverless-safe pdfjs build — pdf-parse's pdfjs engine needs
    // worker/font files that Vercel doesn't bundle into functions, so it fails there.
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return (Array.isArray(text) ? text.join("\n") : text).replace(/\n{3,}/g, "\n\n").trim();
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (name.endsWith(".txt")) {
    return buffer.toString("utf-8").trim();
  }

  return "";
}
