import type { Candidate } from "@/lib/store/types";

// A candidate's edit token is their private credential: whoever holds it can edit
// or delete the profile. It may only ever be handed to the candidate themselves
// (at creation), never included in responses to recruiters or the public.
export type RecruiterCandidateView = Omit<Candidate, "editToken">;

export function forRecruiter(candidate: Candidate): RecruiterCandidateView {
  const view: Partial<Candidate> = { ...candidate };
  delete view.editToken;
  return view as RecruiterCandidateView;
}
