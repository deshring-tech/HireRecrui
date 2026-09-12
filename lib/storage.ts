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

async function supabaseClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );
}

// Saves the file and returns a browser-usable URL.
export async function saveUpload(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  const filename = makeName(originalName);

  if (usingSupabase) {
    const supabase = await supabaseClient();
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

// Maps a stored URL back to its file name — but only for files this app created:
// in our bucket/folder, flat, and named exactly like saveUpload names them. URLs in
// a profile are client-supplied, so anything else (other hosts, nested paths,
// traversal) is refused rather than deleted.
function ownedFileName(url: string): string | null {
  let rest: string;
  if (usingSupabase) {
    const base = (process.env.SUPABASE_URL as string).replace(/\/+$/, "");
    const prefix = `${base}/storage/v1/object/public/${BUCKET}/`;
    if (!url.startsWith(prefix)) return null;
    rest = url.slice(prefix.length);
  } else {
    if (!url.startsWith("/uploads/")) return null;
    rest = url.slice("/uploads/".length);
  }
  let name: string;
  try {
    name = decodeURIComponent(rest.split(/[?#]/)[0]);
  } catch {
    return null;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[A-Za-z0-9]{1,9})?$/i.test(name)
    ? name
    : null;
}

// Best-effort removal of uploaded files. Never throws: a stray orphaned file is
// far less harmful than a deletion request that half-fails with an error.
export async function deleteUploads(urls: string[]): Promise<number> {
  const names = [...new Set(urls.map(ownedFileName).filter((n): n is string => Boolean(n)))];
  if (names.length === 0) return 0;
  try {
    if (usingSupabase) {
      const supabase = await supabaseClient();
      const { error } = await supabase.storage.from(BUCKET).remove(names);
      if (error) throw new Error(error.message);
    } else {
      await Promise.all(names.map((n) => fs.unlink(path.join(LOCAL_DIR, n)).catch(() => undefined)));
    }
    return names.length;
  } catch (err) {
    console.error("[storage] upload deletion failed:", (err as Error).message);
    return 0;
  }
}
