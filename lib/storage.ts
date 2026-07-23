import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

// Pluggable file storage. Local disk (public/uploads) by default — zero setup,
// works in dev and on any persistent-disk host. When SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY are set, files go to a Supabase Storage bucket
// instead (required on Vercel, where the filesystem is ephemeral).

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";
const LOCAL_DIR = path.join(process.cwd(), "public", "uploads");

const usingSupabase = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

function makeName(originalName: string): string {
  const ext = path.extname(originalName).slice(0, 10) || "";
  return `${randomUUID()}${ext}`;
}

// Saves the file and returns a browser-usable URL.
export async function saveUpload(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  const filename = makeName(originalName);

  if (usingSupabase) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false } }
    );
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType, upsert: false });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    return data.publicUrl;
  }

  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
