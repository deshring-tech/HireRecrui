// Checks that a candidate's project links actually resolve. In a market where
// ~78% of resumes contain AI-generated text and most hiring managers say they
// can no longer verify claimed skills, a link that demonstrably loads is the
// strongest cheap signal a profile can carry.

const TIMEOUT_MS = 4000;
const MAX_LINKS = 8;

function toUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

async function isReachable(url: string): Promise<boolean> {
  const attempt = async (method: "HEAD" | "GET") => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        // Some hosts reject requests without a browser-like UA.
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HireFlowBot/1.0)" },
      });
      return res.status < 400;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  // HEAD is cheap, but plenty of hosts don't implement it — fall back to GET.
  if (await attempt("HEAD")) return true;
  return attempt("GET");
}

// Returns the subset of `links` that resolved successfully.
export async function verifyLinks(links: string[]): Promise<string[]> {
  const candidates = links
    .map((l) => ({ raw: l, url: toUrl(l) }))
    .filter((x): x is { raw: string; url: string } => Boolean(x.url))
    .slice(0, MAX_LINKS);

  const results = await Promise.allSettled(
    candidates.map(async (c) => ((await isReachable(c.url)) ? c.raw : null))
  );

  return results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((v): v is string => Boolean(v));
}
