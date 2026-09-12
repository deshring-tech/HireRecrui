import fs from "fs";
import path from "path";
import {
  AdminRows,
  Candidate,
  Job,
  Notification,
  PasswordResetToken,
  Session,
  Store,
  User,
} from "./types";
import { uploadUrlsFromProjects } from "./uploadRefs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

type DB = {
  candidates: Candidate[];
  users: User[];
  sessions: Session[];
  resetTokens: PasswordResetToken[];
  jobs: Job[];
  notifications: Notification[];
};

function emptyDB(): DB {
  return { candidates: [], users: [], sessions: [], resetTokens: [], jobs: [], notifications: [] };
}

function ensureDB(): void {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyDB(), null, 2));
  }
}

function readDB(): DB {
  ensureDB();
  const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  return { ...emptyDB(), ...raw };
}

// Atomic write: temp file + fsync + rename. rename() is atomic on the same
// filesystem, so a reader never sees a half-written file.
function writeDB(db: DB): void {
  const tmp = path.join(DATA_DIR, `.db.${process.pid}.${Date.now()}.tmp`);
  const fd = fs.openSync(tmp, "w");
  try {
    fs.writeFileSync(fd, JSON.stringify(db, null, 2));
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, DB_PATH);
}

// Node runs JS single-threaded, so a synchronous read-modify-write within one
// function call can't interleave with another transaction.
function tx<T>(fn: (db: DB) => T): T {
  const db = readDB();
  const result = fn(db);
  writeDB(db);
  return result;
}

export const jsonStore: Store = {
  async listCandidates(recruiterId) {
    return readDB()
      .candidates.filter((c) => c.recruiterId === recruiterId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getCandidate(id) {
    return readDB().candidates.find((c) => c.id === id);
  },
  async getCandidateByEditToken(token) {
    return readDB().candidates.find((c) => c.editToken === token);
  },
  async addCandidate(c) {
    tx((db) => db.candidates.push(c));
  },
  async updateCandidate(id, patch) {
    return tx((db) => {
      const idx = db.candidates.findIndex((c) => c.id === id);
      if (idx === -1) return undefined;
      db.candidates[idx] = { ...db.candidates[idx], ...patch };
      return db.candidates[idx];
    });
  },

  async listOpenToMatchingCandidates() {
    return readDB()
      .candidates.filter((c) => c.openToMatching)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async listAllOpenJobs() {
    return readDB()
      .jobs.filter((j) => j.status === "open")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listJobs(recruiterId) {
    return readDB()
      .jobs.filter((j) => j.recruiterId === recruiterId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getJob(id) {
    return readDB().jobs.find((j) => j.id === id);
  },
  async addJob(j) {
    tx((db) => db.jobs.push(j));
  },
  async updateJob(id, patch) {
    return tx((db) => {
      const idx = db.jobs.findIndex((j) => j.id === id);
      if (idx === -1) return undefined;
      db.jobs[idx] = { ...db.jobs[idx], ...patch };
      return db.jobs[idx];
    });
  },

  async getUserByEmail(email) {
    return readDB().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  async getUserById(id) {
    return readDB().users.find((u) => u.id === id);
  },
  async addUser(u) {
    tx((db) => db.users.push(u));
  },
  async updateUser(id, patch) {
    return tx((db) => {
      const idx = db.users.findIndex((u) => u.id === id);
      if (idx === -1) return undefined;
      db.users[idx] = { ...db.users[idx], ...patch };
      return db.users[idx];
    });
  },

  async addSession(s) {
    tx((db) => db.sessions.push(s));
  },
  async getSession(token) {
    return readDB().sessions.find((s) => s.token === token);
  },
  async deleteSession(token) {
    tx((db) => {
      db.sessions = db.sessions.filter((s) => s.token !== token);
    });
  },

  async addResetToken(t) {
    tx((db) => {
      db.resetTokens = db.resetTokens.filter((r) => r.userId !== t.userId);
      db.resetTokens.push(t);
    });
  },
  async getResetToken(token) {
    return readDB().resetTokens.find((r) => r.token === token);
  },
  async deleteResetToken(token) {
    tx((db) => {
      db.resetTokens = db.resetTokens.filter((r) => r.token !== token);
    });
  },

  async addNotification(n) {
    tx((db) => db.notifications.push(n));
  },
  async listNotifications(audience) {
    return readDB()
      .notifications.filter((n) => n.audience === audience)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async markNotificationsRead(audience) {
    tx((db) => {
      db.notifications = db.notifications.map((n) =>
        n.audience === audience ? { ...n, read: true } : n
      );
    });
  },

  // --- deletion (mirrors the Postgres foreign-key behaviour in supabase/schema.sql) ---

  async deleteCandidate(id) {
    tx((db) => {
      db.candidates = db.candidates.filter((c) => c.id !== id);
      db.notifications = db.notifications.filter((n) => n.candidateId !== id);
    });
  },
  async detachCandidate(id) {
    tx((db) => {
      const c = db.candidates.find((x) => x.id === id);
      if (!c) return;
      c.recruiterId = null;
      c.jobId = null;
      c.score = undefined;
      c.status = "new";
      c.decisionReason = undefined;
      c.updatedAt = new Date().toISOString();
    });
  },
  async deleteUser(id) {
    tx((db) => {
      const jobIds = new Set(db.jobs.filter((j) => j.recruiterId === id).map((j) => j.id));
      const removedCandidates = new Set(
        db.candidates.filter((c) => c.recruiterId === id).map((c) => c.id)
      );
      db.jobs = db.jobs.filter((j) => j.recruiterId !== id);
      db.candidates = db.candidates.filter((c) => c.recruiterId !== id); // ON DELETE CASCADE
      for (const c of db.candidates) if (c.jobId && jobIds.has(c.jobId)) c.jobId = null; // ON DELETE SET NULL
      db.notifications = db.notifications.filter(
        (n) => !(n.candidateId && removedCandidates.has(n.candidateId))
      );
      db.sessions = db.sessions.filter((s) => s.userId !== id);
      db.resetTokens = db.resetTokens.filter((r) => r.userId !== id);
      db.users = db.users.filter((u) => u.id !== id);
    });
  },
  async deleteNotificationsForAudience(audience) {
    tx((db) => {
      db.notifications = db.notifications.filter((n) => n.audience !== audience);
    });
  },
  async listAllCandidateUploads() {
    return readDB().candidates.map((c) => ({ id: c.id, urls: uploadUrlsFromProjects(c.projects) }));
  },

  // --- admin ---

  async adminRows(): Promise<AdminRows> {
    const db = readDB();
    return {
      users: db.users.map((u) => ({ id: u.id, createdAt: u.createdAt, lastSeenAt: u.lastSeenAt ?? null })),
      sessions: db.sessions.map((s) => ({ userId: s.userId, createdAt: s.createdAt })),
      candidates: db.candidates.map((c) => ({
        recruiterId: c.recruiterId,
        createdAt: c.createdAt,
        viewCount: c.viewCount ?? 0,
        openToMatching: Boolean(c.openToMatching),
        status: c.status,
        source: c.source ?? null,
      })),
      jobs: db.jobs.map((j) => ({ status: j.status, createdAt: j.createdAt })),
    };
  },
};
