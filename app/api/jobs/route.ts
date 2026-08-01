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

  const { title, requirement, salaryRange } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Give the role a title." }, { status: 400 });
  }

  const job: Job = {
    id: randomUUID(),
    recruiterId: user.id,
    title: title.trim(),
    requirement: requirement?.trim() || "",
    salaryRange: salaryRange?.trim() || "",
    status: "open",
    createdAt: new Date().toISOString(),
  };
  try {
    await addJob(job);
  } catch (err) {
    console.error("[jobs] create failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Couldn't save the role. If you just updated the app, run the latest database migration." },
      { status: 500 }
    );
  }
  return NextResponse.json({ job });
}
