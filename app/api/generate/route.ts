import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { aiJSON } from "@/lib/ai";
import {
  addCandidate,
  getCandidateByEditToken,
  getJob,
  getUserById,
  updateCandidate,
  Candidate,
  DocumentRef,
  ResumeProfile,
} from "@/lib/db";
import {
  extractSkills,
  buildSummary,
  buildProjectExplanation,
  buildProjectImpact,
  computeStrengths,
  computeGrowthAreas,
} from "@/lib/algo";
import { notifyNewCandidate } from "@/lib/notify";
import { rateLimit } from "@/lib/rateLimit";

type ProjectDraft = {
  title: string;
  description: string;
  links: string[];
  images: string[];
  documents: DocumentRef[];
  docsText: string;
};

function fallbackProfile(input: {
  name: string;
  title: string;
  rawResume: string;
  projects: ProjectDraft[];
  clarifyingQA: { question: string; answer: string }[];
}): ResumeProfile {
  const allText =
    input.rawResume +
    " " +
    input.projects.map((p) => p.description + " " + (p.docsText || "")).join(" ") +
    " " +
    input.clarifyingQA.map((qa) => qa.answer).join(" ");
  const skills = extractSkills(allText);

  return {
    name: input.name,
    title: input.title,
    summary: buildSummary({ title: input.title, projects: input.projects, skills }),
    skills,
    projects: input.projects.map((p) => ({
      title: p.title,
      description: p.description,
      tech: extractSkills(p.description + " " + (p.docsText || "")),
      links: p.links,
      images: p.images || [],
      documents: p.documents || [],
      impact: buildProjectImpact(p),
      aiExplanation: buildProjectExplanation(p),
    })),
    experience: [],
    strengths: computeStrengths({ skills, clarifyingQA: input.clarifyingQA }),
    growthAreas: computeGrowthAreas({
      skills,
      projects: input.projects,
      rawResume: input.rawResume,
      clarifyingQA: input.clarifyingQA,
    }),
  };
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "generate", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const body = await req.json();
  const { name, title, email, rawResume, projects, clarifyingQA, style, recruiterId, jobId, editToken, consent } = body;

  // Editing an existing profile: the edit token is the authorization.
  const existing = editToken ? await getCandidateByEditToken(editToken) : undefined;
  if (editToken && !existing) {
    return NextResponse.json({ error: "This edit link is no longer valid." }, { status: 404 });
  }

  const effectiveRecruiterId = existing ? existing.recruiterId : recruiterId;

  if (!existing) {
    if (!effectiveRecruiterId || !(await getUserById(effectiveRecruiterId))) {
      return NextResponse.json(
        { error: "This link isn't tied to a valid recruiter account. Ask them for their personalized intake link." },
        { status: 400 }
      );
    }
    if (!consent) {
      return NextResponse.json(
        { error: "Please confirm consent before submitting your information." },
        { status: 400 }
      );
    }
  }

  // Validate the job belongs to the recruiter (if one was supplied).
  const effectiveJobId = existing ? existing.jobId : jobId || null;
  if (effectiveJobId) {
    const job = await getJob(effectiveJobId);
    if (!job || job.recruiterId !== effectiveRecruiterId) {
      return NextResponse.json({ error: "That role is no longer available." }, { status: 400 });
    }
  }

  const fallback = fallbackProfile({ name, title, rawResume, projects, clarifyingQA });

  const profile = await aiJSON<ResumeProfile>(
    `You turn a candidate's raw resume, project list (including any text extracted from attached documents), and Q&A answers into a structured, interactive, ATS-friendly resume profile. Style requested: "${style}".
Rules:
- Only use information given or reasonably inferred from it. Do not invent employers, dates, or metrics that weren't provided.
- summary: 2 sentences, punchy, recruiter-facing.
- skills: flat array of concrete skills/technologies actually evidenced by the input.
- projects: for each input project, produce {title, description (1-2 sentences, ATS-friendly, action-verb led), tech (array), links (array, keep given links), images (array, keep given image URLs unchanged), impact (short, factual, say "not specified" if unknown), aiExplanation (1-2 plain-language sentences a non-technical recruiter could understand)}.
- experience: infer discrete roles from the raw resume text if present, else empty array. Each: {role, company, period, bullets (2-4 ATS-friendly bullets)}.
- strengths: 3-5 short bullet phrases.
- growthAreas: 1-3 short, constructive, non-judgmental phrases (e.g. "No deployed production project yet"). Empty array if nothing notable.
Return strict JSON matching this shape exactly, no extra keys, no markdown.`,
    JSON.stringify({ name, title, email, rawResume, projects, clarifyingQA }, null, 2),
    fallback
  );

  // AI (or fallback) may omit fields like images/documents that aren't its concern —
  // always trust the original uploaded file references rather than whatever the model returns.
  const mergedProjects = fallback.projects.map((fp, i) => ({
    ...fp,
    ...(profile.projects?.[i] || {}),
    images: fp.images,
    documents: fp.documents,
  }));

  const finalProfile = { ...fallback, ...profile, name, title, projects: mergedProjects };
  const now = new Date().toISOString();

  if (existing) {
    await updateCandidate(existing.id, {
      name,
      title,
      email,
      rawResume,
      projects,
      clarifyingQA,
      style,
      profile: finalProfile,
      updatedAt: now,
    });
    return NextResponse.json({ id: existing.id, editToken: existing.editToken });
  }

  const candidate: Candidate = {
    id: randomUUID(),
    recruiterId: effectiveRecruiterId,
    jobId: effectiveJobId,
    editToken: randomUUID(),
    name,
    title,
    email,
    rawResume,
    projects,
    clarifyingQA,
    style,
    profile: finalProfile,
    status: "new",
    createdAt: now,
    updatedAt: now,
  };

  await addCandidate(candidate);
  await notifyNewCandidate(candidate);

  return NextResponse.json({ id: candidate.id, editToken: candidate.editToken });
}
