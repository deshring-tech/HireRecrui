import { NextRequest, NextResponse } from "next/server";
import { aiJSON } from "@/lib/ai";
import { getJob, listCandidates, updateJob, updateCandidate, Score } from "@/lib/db";
import { scoreCandidateAlgorithmic } from "@/lib/algo";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { jobId, jobRequirement } = await req.json();

  const job = jobId ? await getJob(jobId) : undefined;
  if (jobId && (!job || job.recruiterId !== user.id)) {
    return NextResponse.json({ error: "That role wasn't found." }, { status: 404 });
  }

  // Requirement comes from the job if scoring a job, else the ad-hoc text.
  const requirement = job ? jobRequirement ?? job.requirement : jobRequirement || "";

  // Persist an edited requirement back onto the job so it sticks.
  if (job && typeof jobRequirement === "string" && jobRequirement !== job.requirement) {
    await updateJob(job.id, { requirement: jobRequirement });
  }

  // Only score the candidates in scope: this job's pool, or all of the recruiter's
  // candidates when no job is specified.
  const candidates = (await listCandidates(user.id)).filter((c) => (job ? c.jobId === job.id : true));

  await Promise.all(
    candidates.map(async (c) => {
      const fallback: Score = scoreCandidateAlgorithmic(requirement, c.profile.skills || []);

      const score = await aiJSON<Score>(
        `You are an assistant helping a recruiter triage candidates. You NEVER make the final hiring decision — you only provide an advisory match score and short reasons. Given a job requirement and a candidate's profile JSON, return strict JSON: {"value": 0-100 number, "label": "High Match" | "Needs Review" | "Low Match", "reasons": string[] (2-4 short, specific, factual bullet reasons tied to the requirement)}. Base this only on the evidence in the profile — do not infer protected characteristics (age, gender, race, disability, etc.) and do not penalize gaps unrelated to the stated requirement.`,
        `Job requirement: ${requirement || "(general software role, no specific requirement given)"}\n\nCandidate profile:\n${JSON.stringify(c.profile)}`,
        fallback
      );

      await updateCandidate(c.id, { score });
    })
  );

  return NextResponse.json({ candidates: await listCandidates(user.id) });
}
