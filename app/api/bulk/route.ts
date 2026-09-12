import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { extractTextFromBuffer } from "@/lib/extract";
import { buildProfileFromResume } from "@/lib/profile";
import { scoreCandidateAlgorithmic } from "@/lib/algo";
import { addCandidate, listCandidates, listJobs, Candidate, Score } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 20;

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "bulk", limit: 6, windowMs: 60_000 });
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const formData = await req.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) return NextResponse.json({ error: "No resumes provided." }, { status: 400 });
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Please upload at most ${MAX_FILES} resumes at a time.` },
      { status: 413 }
    );
  }

  // The recruiter's open roles — each candidate is routed to the best-fitting one.
  const openJobs = (await listJobs(user.id)).filter((j) => j.status === "open");

  // Existing emails, so re-uploading the same resume doesn't create duplicates.
  const seenEmails = new Set(
    (await listCandidates(user.id)).map((c) => c.email?.toLowerCase()).filter(Boolean) as string[]
  );

  const results: { name: string; title: string; job: string | null; score: number; label: string }[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      skipped.push(`${file.name} (too large)`);
      continue;
    }

    let text = "";
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractTextFromBuffer(buffer, file.name);
    } catch {
      skipped.push(`${file.name} (unreadable)`);
      continue;
    }
    if (!text) {
      skipped.push(`${file.name} (no text found)`);
      continue;
    }

    const { name, title, email, profile } = buildProfileFromResume(text, file.name);

    // Skip re-uploads of a candidate already in this recruiter's pool.
    const emailKey = email?.toLowerCase();
    if (emailKey && seenEmails.has(emailKey)) {
      skipped.push(`${file.name} (already in your pool)`);
      continue;
    }
    if (emailKey) seenEmails.add(emailKey);

    // Score against every open role; route to the highest match. With no open
    // roles the candidate is left unassigned with a neutral baseline score.
    let bestJobId: string | null = null;
    let bestJobTitle: string | null = null;
    let bestScore: Score = scoreCandidateAlgorithmic("", profile.skills);
    for (const job of openJobs) {
      const s = scoreCandidateAlgorithmic(job.requirement, profile.skills);
      if (bestJobId === null || s.value > bestScore.value) {
        bestScore = s;
        bestJobId = job.id;
        bestJobTitle = job.title;
      }
    }

    const now = new Date().toISOString();
    const candidate: Candidate = {
      id: randomUUID(),
      recruiterId: user.id,
      jobId: bestJobId,
      editToken: randomUUID(),
      name,
      title,
      email,
      rawResume: text,
      projects: [],
      clarifyingQA: [],
      style: "ats",
      profile,
      score: bestScore,
      source: "bulk",
      status: "new", // human decides every accept/reject
      createdAt: now,
      updatedAt: now,
    };
    await addCandidate(candidate);

    results.push({
      name,
      title,
      job: bestJobTitle,
      score: bestScore.value,
      label: bestScore.label,
    });
  }

  // Highest matches first.
  results.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    created: results.length,
    skipped,
    hadOpenJobs: openJobs.length > 0,
    results,
  });
}
