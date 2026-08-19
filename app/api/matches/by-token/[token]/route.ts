import { NextRequest, NextResponse } from "next/server";
import { getCandidateByEditToken, getUserById, listAllOpenJobs } from "@/lib/db";
import { scoreCandidateAlgorithmic } from "@/lib/algo";

export const dynamic = "force-dynamic";

const MIN_SCORE = 50;
const MAX_ROLES = 10;

// Candidate side: which open roles fit me? Authorized by the unguessable edit
// token, so no account is required.
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const candidate = await getCandidateByEditToken(params.token);
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!candidate.openToMatching) {
    return NextResponse.json({ matches: [], optedIn: false });
  }

  const jobs = await listAllOpenJobs();
  const skills = candidate.profile.skills || [];

  const scored = jobs
    .map((job) => ({ job, score: scoreCandidateAlgorithmic(job.requirement, skills) }))
    .filter((m) => m.score.value >= MIN_SCORE)
    .sort((a, b) => b.score.value - a.score.value)
    .slice(0, MAX_ROLES);

  // Resolve the hiring company/recruiter name for display.
  const matches = await Promise.all(
    scored.map(async (m) => {
      const recruiter = await getUserById(m.job.recruiterId);
      return {
        jobId: m.job.id,
        title: m.job.title,
        salaryRange: m.job.salaryRange || "",
        recruiterName: recruiter?.name || "A recruiter",
        // The intake link, pre-tagged to this role.
        applyPath: `/candidate?r=${m.job.recruiterId}&job=${m.job.id}`,
        score: m.score,
      };
    })
  );

  return NextResponse.json({ matches, optedIn: true });
}
