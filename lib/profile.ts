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
  "accountant", "nurse", "teacher", "writer", "editor", "coordinator", "officer",
  "director", "executive", "assistant", "technician", "strategist", "operator",
];

// Words that appear in resume section headings — a name line never contains these.
const SECTION_WORDS = [
  "experience", "education", "skills", "summary", "objective", "profile",
  "projects", "certification", "certifications", "award", "awards", "achievement",
  "achievements", "leadership", "reference", "references", "contact", "work",
  "employment", "professional", "languages", "interests", "activities", "volunteer",
  "publications", "portfolio", "about", "expertise", "highlights", "career",
  "resume", "curriculum", "vitae",
];

// Connector words that show up in headings but essentially never in a person's name.
const NAME_STOPWORDS = ["and", "or", "of", "the", "for", "with", "to", "in", "at", "&"];

function guessEmail(text: string): string {
  const m = text.match(EMAIL_RE);
  return m ? m[0] : "";
}

function isLikelyName(line: string): boolean {
  if (/@|\d|https?:|www\./i.test(line)) return false;
  const low = line.toLowerCase();
  if (SECTION_WORDS.some((w) => low.includes(w))) return false;
  const words = line.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  if (words.some((w) => NAME_STOPWORDS.includes(w.toLowerCase()))) return false;
  // Each word looks like a name token (handles Title Case and ALL CAPS).
  return words.every((w) => /^[A-Za-z][a-zA-Z.'-]*$/.test(w) && /^[A-Z]/.test(w));
}

function guessName(text: string, filename: string): string {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);

  // 1) First plausible name near the top of the document.
  for (const line of lines.slice(0, 8)) {
    if (isLikelyName(line)) return line;
  }
  // 2) The line just before the email is very often the name.
  const emailIdx = lines.findIndex((l) => EMAIL_RE.test(l));
  if (emailIdx > 0 && isLikelyName(lines[emailIdx - 1])) return lines[emailIdx - 1];

  // 3) Fall back to a cleaned-up filename.
  const fromFile = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(resume|cv|curriculum|vitae|final|updated|copy|professional|simple)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return fromFile || "Unnamed candidate";
}

function guessTitle(text: string, skills: string[]): string {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean).slice(0, 15);
  for (const line of lines) {
    const low = line.toLowerCase();
    if (line.length > 60 || /@|https?:/.test(line)) continue;
    // Any section word anywhere disqualifies the line — "Leadership And
    // Achievement" is a heading, not a job title.
    if (SECTION_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(low))) continue;
    // Whole-word keyword match, so "leadership" doesn't match the keyword "lead".
    if (TITLE_KEYWORDS.some((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(low))) {
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
