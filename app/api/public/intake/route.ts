import { NextRequest, NextResponse } from "next/server";
import { getJob, getUserById } from "@/lib/db";

// Public, read-only context for the candidate intake page: whose link this is
// and (optionally) which open role they're applying to.
export async function GET(req: NextRequest) {
  const recruiterId = req.nextUrl.searchParams.get("r") || "";
  const jobId = req.nextUrl.searchParams.get("job") || "";

  const recruiter = recruiterId ? await getUserById(recruiterId) : undefined;
  if (!recruiter) {
    return NextResponse.json({ valid: false });
  }

  let job: { id: string; title: string; salaryRange: string } | null = null;
  if (jobId) {
    const j = await getJob(jobId);
    if (j && j.recruiterId === recruiter.id && j.status === "open") {
      job = { id: j.id, title: j.title, salaryRange: j.salaryRange || "" };
    }
  }

  return NextResponse.json({
    valid: true,
    recruiterName: recruiter.name,
    job,
  });
}
