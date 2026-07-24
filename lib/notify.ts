import { randomUUID } from "crypto";
import { addNotification, getUserById, Candidate, CandidateStatus } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const STATUS_MESSAGE: Record<CandidateStatus, string> = {
  new: "Your profile was received.",
  accepted: "Good news — a recruiter marked your profile as accepted.",
  interview: "A recruiter would like to move you forward to an interview.",
  rejected: "A recruiter has reviewed your profile and decided not to proceed this time.",
};

// Fired when a candidate submits through a recruiter's intake link.
export async function notifyNewCandidate(candidate: Candidate): Promise<void> {
  if (!candidate.recruiterId) return;
  const recruiter = await getUserById(candidate.recruiterId);
  if (!recruiter) return;

  await addNotification({
    id: randomUUID(),
    audience: recruiter.id,
    type: "new_candidate",
    message: `${candidate.name} (${candidate.title}) submitted a profile.`,
    candidateId: candidate.id,
    read: false,
    createdAt: new Date().toISOString(),
  });

  await sendEmail({
    to: recruiter.email,
    subject: `New candidate: ${candidate.name}`,
    body: `${candidate.name} (${candidate.title}) just submitted an interactive profile. Review it in your HireFlow dashboard.`,
  });
}

// Fired when a recruiter accepts / rejects / requests an interview.
export async function notifyStatusChange(
  candidate: Candidate,
  status: CandidateStatus,
  decisionReason?: string
): Promise<void> {
  const base = STATUS_MESSAGE[status] || "Your profile status was updated.";
  const message = decisionReason ? `${base} Note from the recruiter: ${decisionReason}` : base;

  await addNotification({
    id: randomUUID(),
    audience: `candidate:${candidate.id}`,
    type: "status_change",
    message,
    candidateId: candidate.id,
    read: false,
    createdAt: new Date().toISOString(),
  });

  if (candidate.email) {
    await sendEmail({
      to: candidate.email,
      subject: "Update on your HireFlow profile",
      body: message,
    });
  }
}
