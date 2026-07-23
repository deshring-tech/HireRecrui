import { NextRequest, NextResponse } from "next/server";
import { aiText } from "@/lib/ai";
import { getCandidate } from "@/lib/db";
import { answerFromProfile } from "@/lib/algo";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "ask", limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const { candidateId, question } = await req.json();
  const candidate = await getCandidate(candidateId);
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fallback = answerFromProfile(question, candidate.profile);

  const answer = await aiText(
    `You answer visitor questions about a specific job candidate, using ONLY the JSON profile data provided. Never invent facts. If the data doesn't cover the question, say so plainly and suggest what to ask the candidate directly instead. Keep answers to 2-4 sentences, factual, recruiter-friendly tone.`,
    `Candidate profile JSON:\n${JSON.stringify(candidate.profile)}\n\nRaw resume text:\n${candidate.rawResume}\n\nQuestion: ${question}`,
    fallback
  );

  return NextResponse.json({ answer });
}
