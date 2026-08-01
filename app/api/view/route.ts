import { NextRequest, NextResponse } from "next/server";
import { getCandidate, updateCandidate } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyProfileViewed } from "@/lib/notify";
import { rateLimit } from "@/lib/rateLimit";

// Records that a profile was opened. "Was my application even looked at?" is the
// single most-cited candidate frustration, so this makes the answer visible.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "view", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { candidateId } = await req.json();
  const candidate = candidateId ? await getCandidate(candidateId) : undefined;
  if (!candidate) return NextResponse.json({ ok: false }, { status: 404 });

  const viewer = await getCurrentUser();
  const isOwningRecruiter = Boolean(viewer && viewer.id === candidate.recruiterId);

  const patch: Parameters<typeof updateCandidate>[1] = {
    viewCount: (candidate.viewCount || 0) + 1,
  };

  // Record the first time the hiring recruiter actually opened it, and tell the
  // candidate once — no repeat pings on every refresh.
  const firstRecruiterView = isOwningRecruiter && !candidate.viewedAt;
  if (firstRecruiterView) patch.viewedAt = new Date().toISOString();

  await updateCandidate(candidate.id, patch);
  if (firstRecruiterView) await notifyProfileViewed(candidate);

  return NextResponse.json({ ok: true });
}
