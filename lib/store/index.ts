import { Store } from "./types";
import { jsonStore } from "./json";

// Supabase is used when both env vars are present; otherwise we fall back to the
// local JSON store so the app runs with zero external setup (dev + demo).
export const usingSupabase = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  if (usingSupabase) {
    // Lazy import so the Supabase client is only loaded when configured.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { supabaseStore } = require("./supabase") as typeof import("./supabase");
    cached = supabaseStore;
  } else {
    cached = jsonStore;
  }
  return cached;
}
