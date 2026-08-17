import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listJobs, listOpenToMatchingCandidates } from "@/lib/db";
import { scoreCandidateAlgorithmic } from "@/lib/algo";

export const dynamic = "force-dynamic";

// Minimum score before a candidate is surfaced as a match. Deliberately high:
// the point is precision, not volume — a matching engine that surfaces everyone
// just recreates the application flood it exists to solve.
const MIN_SCORE = 50;
const MAX_PER_JOB = 5;

// Recruiter side: for each of my open roles, who in the opted-in talent pool fits?
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const myJobs = (await listJobs(user.id)).filter((j) => j.status === "open");
  if (myJobs.length === 0) {
    return NextResponse.json({ matches: [], reason: "no-open-roles" });
  }

  const pool = await listOpenToMatchingCandidates();

  const matches = myJobs.map((job) => {
    const scored = pool
      // Skip anyone already in this recruiter's own pipeline.
      .filter((c) => c.recruiterId !== user.id)
      .map((c) => ({ candidate: c, score: scoreCandidateAlgorithmic(job.requirement, c.profile.skills || []) }))
      .filter((m) => m.score.value >= MIN_SCORE)
      .sort((a, b) => b.score.value - a.score.value)
      .slice(0, MAX_PER_JOB)
      .map((m) => ({
        id: m.candidate.id,
        name: m.candidate.profile.name,
        title: m.candidate.profile.title,
        summary: m.candidate.profile.summary,
        skills: m.candidate.profile.skills,
        // Opting in means agreeing to be contacted about matching roles.
        email: m.candidate.email,
        verifiedLinks: (m.candidate.profile.projects || []).reduce(
          (n, p) => n + (p.verifiedLinks?.length || 0),
          0
        ),
        score: m.score,
      }));

    return { jobId: job.id, jobTitle: job.title, candidates: scored };
  });

  return NextResponse.json({ matches, poolSize: pool.length });
}
