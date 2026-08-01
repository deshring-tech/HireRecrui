// Entity types + the Store interface. Both storage backends (JSON file and
// Supabase Postgres) implement Store, and lib/db.ts re-exports thin async wrappers
// so route code keeps importing from "@/lib/db".

export type DocumentRef = { url: string; name: string };

export type ProjectInput = {
  title: string;
  description: string;
  links: string[];
  images: string[];
  documents: DocumentRef[];
};

export type QA = { question: string; answer: string };

export type ProjectProfile = {
  title: string;
  description: string;
  tech: string[];
  links: string[];
  images: string[];
  documents: DocumentRef[];
  impact: string;
  aiExplanation: string;
  // Links confirmed reachable at profile-build time — the "verified evidence"
  // signal that separates real work from unverifiable resume claims.
  verifiedLinks?: string[];
};

export type ResumeProfile = {
  name: string;
  title: string;
  summary: string;
  skills: string[];
  projects: ProjectProfile[];
  experience: { role: string; company: string; period: string; bullets: string[] }[];
  strengths: string[];
  growthAreas: string[];
};

export type Score = {
  value: number;
  label: "High Match" | "Needs Review" | "Low Match";
  reasons: string[];
};

export type CandidateStatus = "new" | "accepted" | "rejected" | "interview";

export type Candidate = {
  id: string;
  recruiterId: string | null;
  jobId: string | null;
  editToken: string;
  name: string;
  title: string;
  email: string;
  rawResume: string;
  projects: ProjectInput[];
  clarifyingQA: QA[];
  style: "ats" | "modern" | "technical";
  profile: ResumeProfile;
  score?: Score;
  status: CandidateStatus;
  decisionReason?: string;
  // Transparency: when a recruiter first opened this profile, and total views.
  viewedAt?: string | null;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: string;
};

export type PasswordResetToken = {
  token: string;
  userId: string;
  expiresAt: string;
};

export type Job = {
  id: string;
  recruiterId: string;
  title: string;
  requirement: string;
  salaryRange?: string;
  status: "open" | "closed";
  createdAt: string;
};

export type Notification = {
  id: string;
  audience: string;
  type: "new_candidate" | "status_change";
  message: string;
  candidateId?: string;
  read: boolean;
  createdAt: string;
};

export interface Store {
  // candidates
  listCandidates(recruiterId: string): Promise<Candidate[]>;
  getCandidate(id: string): Promise<Candidate | undefined>;
  getCandidateByEditToken(token: string): Promise<Candidate | undefined>;
  addCandidate(c: Candidate): Promise<void>;
  updateCandidate(id: string, patch: Partial<Candidate>): Promise<Candidate | undefined>;

  // jobs
  listJobs(recruiterId: string): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  addJob(j: Job): Promise<void>;
  updateJob(id: string, patch: Partial<Job>): Promise<Job | undefined>;

  // users
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  addUser(u: User): Promise<void>;
  updateUser(id: string, patch: Partial<User>): Promise<User | undefined>;

  // sessions
  addSession(s: Session): Promise<void>;
  getSession(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;

  // password reset
  addResetToken(t: PasswordResetToken): Promise<void>;
  getResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deleteResetToken(token: string): Promise<void>;

  // notifications
  addNotification(n: Notification): Promise<void>;
  listNotifications(audience: string): Promise<Notification[]>;
  markNotificationsRead(audience: string): Promise<void>;
}
