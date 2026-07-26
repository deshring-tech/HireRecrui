// Builds a lightweight candidate profile from raw resume text — used by the
// recruiter bulk-upload flow. Name/title/email are extracted heuristically
// (cheap + fast, so ingesting 100 resumes doesn't fire 100 AI calls); skills and
// summary come from the deterministic algo engine.
import { ResumeProfile } from "@/lib/db";
import {
  extractSkills,
  buildSummary,
  computeStrengths,
  computeGrowthAreas,
} from "@/lib/algo";

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

const TITLE_KEYWORDS = [
  "engineer", "developer", "designer", "manager", "analyst", "scientist",
  "architect", "consultant", "specialist", "lead", "intern", "administrator",
  "devops", "programmer", "full-stack", "fullstack", "frontend", "front-end",
  "backend", "back-end", "marketer", "recruiter", "product", "qa", "researcher",
];

function guessEmail(text: string): string {
  const m = text.match(EMAIL_RE);
  return m ? m[0] : "";
}

function guessName(text: string, filename: string): string {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    if (/@|\d|https?:|www\.|resume|curriculum|vitae/i.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z][a-zA-Z.'-]+$/.test(w))) {
      return line;
    }
  }
  // Fall back to a cleaned-up filename.
  const fromFile = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(resume|cv|final|updated|copy)\b/gi, "")
    .trim();
  return fromFile || "Unnamed candidate";
}

function guessTitle(text: string, skills: string[]): string {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean).slice(0, 12);
  for (const line of lines) {
    const low = line.toLowerCase();
    if (line.length <= 60 && !/@|https?:/.test(line) && TITLE_KEYWORDS.some((k) => low.includes(k))) {
      return line;
    }
  }
  return skills.length ? "Software Professional" : "Candidate";
}

export function buildProfileFromResume(
  rawText: string,
  filename: string
): { name: string; title: string; email: string; profile: ResumeProfile } {
  const skills = extractSkills(rawText);
  const name = guessName(rawText, filename);
  const title = guessTitle(rawText, skills);
  const email = guessEmail(rawText);

  const profile: ResumeProfile = {
    name,
    title,
    summary: buildSummary({ title, projects: [], skills }),
    skills,
    projects: [],
    experience: [],
    strengths: computeStrengths({ skills, clarifyingQA: [] }),
    growthAreas: computeGrowthAreas({ skills, projects: [], rawResume: rawText, clarifyingQA: [] }),
  };

  return { name, title, email, profile };
}
