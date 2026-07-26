// Shared resume/document text extraction. Used by the single-file upload route
// and the bulk resume ingestion route.

export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const name = filename.toLowerCase();

  if (name.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text
        .replace(/^--\s*\d+\s*of\s*\d+\s*--$/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    } finally {
      await parser.destroy();
    }
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
