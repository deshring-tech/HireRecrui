import { NextRequest, NextResponse } from "next/server";
import { getCandidateByEditToken } from "@/lib/db";

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
    },
  });
}
