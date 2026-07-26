import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { saveUpload } from "@/lib/storage";
import { extractTextFromBuffer } from "@/lib/extract";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 4000;

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "upload", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const formData = await req.formData();
  const kind = formData.get("kind") as string | null;
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (8MB max)" }, { status: 413 });

  if (kind === "resume") {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await extractTextFromBuffer(buffer, file.name);
      if (!text) {
        return NextResponse.json(
          { error: "Couldn't find text in that file. Try pasting the resume text instead." },
          { status: 422 }
        );
      }
      return NextResponse.json({ text });
    } catch (err) {
      console.error("[upload] resume extraction failed:", (err as Error).stack || err);
      return NextResponse.json(
        { error: "Couldn't read that file. Try pasting the resume text instead." },
        { status: 422 }
      );
    }
  }

  if (kind === "project-image") {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are supported here." }, { status: 415 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveUpload(buffer, file.name || ".png", file.type || "image/png");
    return NextResponse.json({ url });
  }

  if (kind === "project-doc") {
    const allowed = /\.(pdf|docx|txt)$/i.test(file.name);
    if (!allowed) {
      return NextResponse.json({ error: "Only PDF, DOCX, or TXT files are supported here." }, { status: 415 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveUpload(buffer, file.name, file.type || "application/octet-stream");

    let text = "";
    try {
      text = await extractTextFromBuffer(buffer, file.name);
    } catch (err) {
      console.error("[upload] project-doc extraction failed:", (err as Error).message);
      // Non-fatal — the document is still stored and linkable even without extracted text.
    }

    return NextResponse.json({ url, name: file.name, text: text.slice(0, MAX_EXTRACTED_CHARS) });
  }

  return NextResponse.json({ error: "Unknown upload kind" }, { status: 400 });
}
