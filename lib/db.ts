// Thin async facade over the active store (JSON file or Supabase). Route code
// imports from here and doesn't care which backend is active.
import { getStore } from "./store";
import type {
  Candidate,
  Job,
  Notification,
  PasswordResetToken,
  Session,
  User,
} from "./store/types";

export type {
  DocumentRef,
  ProjectInput,
  QA,
  ProjectProfile,
  ResumeProfile,
  Score,
  CandidateStatus,
  Candidate,
  User,
  Session,
  PasswordResetToken,
  Job,
  Notification,
} from "./store/types";

// candidates
export const listCandidates = (recruiterId: string) => getStore().listCandidates(recruiterId);
export const getCandidate = (id: string) => getStore().getCandidate(id);
export const getCandidateByEditToken = (token: string) => getStore().getCandidateByEditToken(token);
export const addCandidate = (c: Candidate) => getStore().addCandidate(c);
export const updateCandidate = (id: string, patch: Partial<Candidate>) =>
  getStore().updateCandidate(id, patch);

// matching pool (cross-recruiter, opt-in only)
export const listOpenToMatchingCandidates = () => getStore().listOpenToMatchingCandidates();
export const listAllOpenJobs = () => getStore().listAllOpenJobs();

// jobs
export const listJobs = (recruiterId: string) => getStore().listJobs(recruiterId);
export const getJob = (id: string) => getStore().getJob(id);
export const addJob = (j: Job) => getStore().addJob(j);
export const updateJob = (id: string, patch: Partial<Job>) => getStore().updateJob(id, patch);

// users
export const getUserByEmail = (email: string) => getStore().getUserByEmail(email);
export const getUserById = (id: string) => getStore().getUserById(id);
export const addUser = (u: User) => getStore().addUser(u);
export const updateUser = (id: string, patch: Partial<User>) => getStore().updateUser(id, patch);

// sessions
export const addSession = (s: Session) => getStore().addSession(s);
export const getSession = (token: string) => getStore().getSession(token);
export const deleteSession = (token: string) => getStore().deleteSession(token);

// password reset
export const addResetToken = (t: PasswordResetToken) => getStore().addResetToken(t);
export const getResetToken = (token: string) => getStore().getResetToken(token);
export const deleteResetToken = (token: string) => getStore().deleteResetToken(token);

// notifications
export const addNotification = (n: Notification) => getStore().addNotification(n);
export const listNotifications = (audience: string) => getStore().listNotifications(audience);
export const markNotificationsRead = (audience: string) => getStore().markNotificationsRead(audience);
