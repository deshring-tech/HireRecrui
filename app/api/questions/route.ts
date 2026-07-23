import { NextRequest, NextResponse } from "next/server";
import { aiJSON } from "@/lib/ai";
import { rateLimit } from "@/lib/rateLimit";

const FALLBACK_QUESTIONS = [
  "For your most significant project, what was your specific, individual contribution?",
  "How many users, customers, or how much measurable impact did that work have?",
  "Which technologies did you use, and why did you choose them?",
  "What was the hardest technical challenge you ran into, and how did you solve it?",
  "What's one accomplishment from your work that you're most proud of?",
];

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "questions", limit: 15, windowMs: 60_000 });
  if (limited) return limited;

  const body = await req.json();
  const { name, title, rawResume, projects } = body;

  const questions = await aiJSON<{ questions: string[] }>(
    "You help job candidates build complete interactive resumes. Given their raw resume text and project list, write 5 short, specific, plain-language clarifying questions that fill the gaps a recruiter would care about (impact, scale, ownership, technical depth, outcomes). Avoid generic questions. Return strict JSON: {\"questions\": string[]} with exactly 5 items.",
    `Name: ${name}\nTitle: ${title}\n\nRaw resume:\n${rawResume || "(none provided)"}\n\nProjects:\n${JSON.stringify(projects, null, 2)}`,
    { questions: FALLBACK_QUESTIONS }
  );

  return NextResponse.json({ questions: questions.questions?.length ? questions.questions : FALLBACK_QUESTIONS });
}
