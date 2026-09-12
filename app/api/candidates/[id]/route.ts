import { NextRequest, NextResponse } from "next/server";
import { getCandidate, updateCandidate, CandidateStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyStatusChange } from "@/lib/notify";
import { forRecruiter } from "@/lib/candidateView";
import { releaseCandidateFromRecruiter } from "@/lib/deletion";
import { rateLimit } from "@/lib/rateLimit";

// Never cache: candidate status and view counts change as recruiters act.
export const dynamic = "force-dynamic";

const VALID_STATUS: CandidateStatus[] = ["new", "accepted", "rejected", "interview"];

// Owner-only. This used to be public and returned the whole record — including the
// candidate's email and private edit token — to anyone who knew the id from the
// public profile URL. Public profile data is rendered by /r/[id] instead.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const candidate = await getCandidate(params.id);
  if (!candidate || candidate.recruiterId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ candidate: forRecruiter(candidate) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const existing = await getCandidate(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.recruiterId !== user.id) {
    return NextResponse.json({ error: "You don't have access to this candidate." }, { status: 403 });
  }

  const body = await req.json();
  const status: CandidateStatus | undefined = VALID_STATUS.includes(body.status) ? body.status : undefined;

  const updated = await updateCandidate(params.id, {
    status: status ?? existing.status,
    decisionReason: body.decisionReason ?? existing.decisionReason,
    updatedAt: new Date().toISOString(),
  });

  // Notify the candidate only when the decision actually changed.
  if (updated && status && status !== existing.status && status !== "new") {
    await notifyStatusChange(updated, status, body.decisionReason, Boolean(body.sendFeedback));
  }

  return NextResponse.json({ candidate: updated ? forRecruiter(updated) : null });
}

// Removes a candidate from the recruiter's pipeline: bulk-uploaded résumés are
// deleted; profiles the candidate submitted are detached and stay theirs.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const limited = rateLimit(req, { bucket: "candidate-release", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const candidate = await getCandidate(params.id);
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (candidate.recruiterId !== user.id) {
    return NextResponse.json({ error: "You don't have access to this candidate." }, { status: 403 });
  }

  try {
    const outcome = await releaseCandidateFromRecruiter(candidate);
    return NextResponse.json({ ok: true, outcome });
  } catch (err) {
    console.error("[candidates] release failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't remove this candidate. Please try again." }, { status: 500 });
  }
}
