import {
  deleteCandidate,
  deleteNotificationsForAudience,
  deleteUser,
  detachCandidate,
  listAllCandidateUploads,
  listCandidates,
  Candidate,
} from "@/lib/db";
import { deleteUploads } from "@/lib/storage";
import { uploadUrlsFromProjects } from "@/lib/store/uploadRefs";

// Removes a profile and its uploaded files. Upload URLs are public and supplied by
// the client, so another profile could reference the very same file — only files
// no other profile points at are deleted.
export async function deleteCandidateCompletely(candidate: Candidate): Promise<void> {
  const ownUploads = uploadUrlsFromProjects(candidate.projects);

  let orphaned: string[] = [];
  if (ownUploads.length > 0) {
    const referencedElsewhere = new Set(
      (await listAllCandidateUploads()).filter((c) => c.id !== candidate.id).flatMap((c) => c.urls)
    );
    orphaned = ownUploads.filter((u) => !referencedElsewhere.has(u));
  }

  await deleteCandidate(candidate.id);
  await deleteUploads(orphaned);
}

// A recruiter letting go of a candidate. Résumés the recruiter bulk-uploaded exist
// only in that recruiter's pipeline — nobody else holds a link to them — so they
// are deleted. Profiles a candidate submitted themselves belong to the candidate:
// they're detached (the recruiter's score and decision are scrubbed) and stay
// under the candidate's control via their private link.
export async function releaseCandidateFromRecruiter(candidate: Candidate): Promise<"deleted" | "detached"> {
  if (candidate.source === "bulk") {
    await deleteCandidateCompletely(candidate);
    return "deleted";
  }
  await detachCandidate(candidate.id);
  return "detached";
}

// Ordered so a failure part-way is safe to retry: candidates are released first,
// and the account row — which the recruiter needs to try again — goes last.
export async function deleteRecruiterAccount(userId: string): Promise<{ deleted: number; detached: number }> {
  const result = { deleted: 0, detached: 0 };
  let previousFirstId: string | undefined;

  // Released candidates drop out of the listing, so re-listing walks past any
  // page-size cap on how many rows one query returns.
  for (;;) {
    const batch = await listCandidates(userId);
    if (batch.length === 0) break;
    if (batch[0].id === previousFirstId) throw new Error("Candidate release made no progress");
    previousFirstId = batch[0].id;
    for (const c of batch) result[await releaseCandidateFromRecruiter(c)]++;
  }

  await deleteNotificationsForAudience(userId);
  await deleteUser(userId);
  return result;
}
