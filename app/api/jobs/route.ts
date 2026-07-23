import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addJob, listJobs, Job } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ jobs: await listJobs(user.id) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { title, requirement } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Give the role a title." }, { status: 400 });
  }

  const job: Job = {
    id: randomUUID(),
    recruiterId: user.id,
    title: title.trim(),
    requirement: requirement?.trim() || "",
    status: "open",
    createdAt: new Date().toISOString(),
  };
  await addJob(job);
  return NextResponse.json({ job });
}
