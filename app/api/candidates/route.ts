import { NextResponse } from "next/server";
import { listCandidates } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { forRecruiter } from "@/lib/candidateView";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ candidates: (await listCandidates(user.id)).map(forRecruiter) });
}
