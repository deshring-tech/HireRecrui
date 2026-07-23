import { NextRequest, NextResponse } from "next/server";
import { getCandidate, updateCandidate, CandidateStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyStatusChange } from "@/lib/notify";

const VALID_STATUS: CandidateStatus[] = ["new", "accepted", "rejected", "interview"];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const candidate = await getCandidate(params.id);
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ candidate });
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
    await notifyStatusChange(updated, status, body.decisionReason);
  }

  return NextResponse.json({ candidate: updated });
}
