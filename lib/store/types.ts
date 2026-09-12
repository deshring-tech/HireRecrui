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
  // Opt-in: lets recruiters other than the owner discover this profile via matching.
  openToMatching?: boolean;
  // How the profile entered the system. Drives deletion: "bulk" résumés exist only
  // in the uploading recruiter's pipeline, while "self"/"link" profiles belong to
  // the candidate. null = created before this was tracked.
  source?: CandidateSource | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateSource = "self" | "link" | "bulk";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  // Last authenticated activity (throttled). Used to measure recruiter retention.
  lastSeenAt?: string | null;
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

  // matching pool (cross-recruiter, opt-in only)
  listOpenToMatchingCandidates(): Promise<Candidate[]>;
  listAllOpenJobs(): Promise<Job[]>;

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

  // deletion — the policy for what gets removed lives in lib/deletion.ts
  deleteCandidate(id: string): Promise<void>;
  // Unlinks a profile from its recruiter and scrubs that recruiter's score/decision.
  detachCandidate(id: string): Promise<void>;
  // Also removes the user's jobs, sessions, reset tokens and still-attached candidates.
  deleteUser(id: string): Promise<void>;
  deleteNotificationsForAudience(audience: string): Promise<void>;
  listAllCandidateUploads(): Promise<{ id: string; urls: string[] }[]>;

  // admin
  adminRows(): Promise<AdminRows>;
}

// Minimal whole-table projections for the admin stats page.
export type AdminRows = {
  users: { id: string; createdAt: string; lastSeenAt: string | null }[];
  sessions: { userId: string; createdAt: string }[];
  candidates: {
    recruiterId: string | null;
    createdAt: string;
    viewCount: number;
    openToMatching: boolean;
    status: CandidateStatus;
    source: CandidateSource | null;
  }[];
  jobs: { status: "open" | "closed"; createdAt: string }[];
};
