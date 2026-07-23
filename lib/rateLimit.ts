import { NextRequest, NextResponse } from "next/server";

// In-memory sliding-window limiter. Good enough for a single-instance deploy.
// When you move to multiple instances, back this with Redis/Upstash — same interface.
const hits = new Map<string, number[]>();

function clientKey(req: NextRequest, bucket: string): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : "") || req.headers.get("x-real-ip") || "local";
  return `${bucket}:${ip.trim()}`;
}

// Returns a 429 response if over the limit, otherwise null (proceed).
export function rateLimit(
  req: NextRequest,
  opts: { bucket: string; limit: number; windowMs: number }
): NextResponse | null {
  const key = clientKey(req, opts.bucket);
  const now = Date.now();
  const windowStart = now - opts.windowMs;

  const recent = (hits.get(key) || []).filter((t) => t > windowStart);
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => t <= windowStart)) hits.delete(k);
    }
  }

  if (recent.length > opts.limit) {
    const retryAfter = Math.ceil(opts.windowMs / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  return null;
}
