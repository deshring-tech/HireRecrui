import { NextRequest, NextResponse } from "next/server";
import { getCandidateByEditToken } from "@/lib/db";
import { deleteCandidateCompletely } from "@/lib/deletion";
import { rateLimit } from "@/lib/rateLimit";

// Never cache: this route reports live status/view counts. A cached response
// would show the candidate stale information indefinitely.
export const dynamic = "force-dynamic";

// Lets a candidate reload their own submission into the wizard to edit it.
// The unguessable edit token is the authorization — no login required.
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const candidate = await getCandidateByEditToken(params.token);
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    candidate: {
      id: candidate.id,
      name: candidate.name,
      title: candidate.title,
      email: candidate.email,
      rawResume: candidate.rawResume,
      projects: candidate.projects,
      style: candidate.style,
      // Transparency for the candidate: where they stand and whether anyone looked.
      status: candidate.status,
      viewCount: candidate.viewCount || 0,
      viewedAt: candidate.viewedAt || null,
      decisionReason: candidate.decisionReason || null,
      hasRecruiter: Boolean(candidate.recruiterId),
      openToMatching: Boolean(candidate.openToMatching),
    },
  });
}

// Candidate deletes their own profile. Same authorization as editing: the private link.
export async function DELETE(req: NextRequest, { params }: { params: { token: string } }) {
  const limited = rateLimit(req, { bucket: "profile-delete", limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const candidate = await getCandidateByEditToken(params.token);
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await deleteCandidateCompletely(candidate);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profile] deletion failed:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't delete your profile. Please try again." }, { status: 500 });
  }
}
