import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Candidate,
  Job,
  Notification,
  PasswordResetToken,
  Session,
  Store,
  User,
} from "./types";

// Uses the service-role key on the server. All access here is server-side only and
// ownership is enforced in the route handlers, so we bypass RLS deliberately. RLS is
// still enabled at the table level (see supabase/schema.sql) so the anon key sees nothing.
let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      {
        auth: { persistSession: false },
        global: {
          // Next.js patches global fetch and caches GET requests by default, which
          // makes supabase-js hand back stale rows (e.g. a candidate still showing
          // "awaiting review" after the recruiter decided). Database reads must
          // always hit the database.
          fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
        },
      }
    );
  }
  return client;
}

// --- row <-> entity mappers ---

function candidateFromRow(r: any): Candidate {
  return {
    id: r.id,
    recruiterId: r.recruiter_id,
    jobId: r.job_id,
    editToken: r.edit_token,
    name: r.name,
    title: r.title,
    email: r.email,
    rawResume: r.raw_resume,
    projects: r.projects ?? [],
    clarifyingQA: r.clarifying_qa ?? [],
    style: r.style,
    profile: r.profile,
    score: r.score ?? undefined,
    status: r.status,
    decisionReason: r.decision_reason ?? undefined,
    viewedAt: r.viewed_at ?? null,
    viewCount: r.view_count ?? 0,
    openToMatching: r.open_to_matching ?? false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function candidateToRow(c: Partial<Candidate>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (c.id !== undefined) row.id = c.id;
  if (c.recruiterId !== undefined) row.recruiter_id = c.recruiterId;
  if (c.jobId !== undefined) row.job_id = c.jobId;
  if (c.editToken !== undefined) row.edit_token = c.editToken;
  if (c.name !== undefined) row.name = c.name;
  if (c.title !== undefined) row.title = c.title;
  if (c.email !== undefined) row.email = c.email;
  if (c.rawResume !== undefined) row.raw_resume = c.rawResume;
  if (c.projects !== undefined) row.projects = c.projects;
  if (c.clarifyingQA !== undefined) row.clarifying_qa = c.clarifyingQA;
  if (c.style !== undefined) row.style = c.style;
  if (c.profile !== undefined) row.profile = c.profile;
  if (c.score !== undefined) row.score = c.score;
  if (c.status !== undefined) row.status = c.status;
  if (c.decisionReason !== undefined) row.decision_reason = c.decisionReason;
  if (c.viewedAt !== undefined) row.viewed_at = c.viewedAt;
  if (c.viewCount !== undefined) row.view_count = c.viewCount;
  if (c.openToMatching !== undefined) row.open_to_matching = c.openToMatching;
  if (c.createdAt !== undefined) row.created_at = c.createdAt;
  if (c.updatedAt !== undefined) row.updated_at = c.updatedAt;
  return row;
}

function jobFromRow(r: any): Job {
  return {
    id: r.id,
    recruiterId: r.recruiter_id,
    title: r.title,
    requirement: r.requirement,
    salaryRange: r.salary_range ?? "",
    status: r.status,
    createdAt: r.created_at,
  };
}

function userFromRow(r: any): User {
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.password_hash,
    name: r.name,
    createdAt: r.created_at,
  };
}

function notificationFromRow(r: any): Notification {
  return {
    id: r.id,
    audience: r.audience,
    type: r.type,
    message: r.message,
    candidateId: r.candidate_id ?? undefined,
    read: r.read,
    createdAt: r.created_at,
  };
}

// Postgres errors (missing column, constraint violation, RLS) come back in the
// response body rather than as thrown exceptions. Without this, a failed write
// would return 200 and the caller would think data was saved when it wasn't.
function assertOk(op: string, error: { message: string } | null): void {
  if (error) throw new Error(`Supabase ${op} failed: ${error.message}`);
}

export const supabaseStore: Store = {
  async listCandidates(recruiterId) {
    const { data } = await db()
      .from("candidates")
      .select("*")
      .eq("recruiter_id", recruiterId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(candidateFromRow);
  },
  async getCandidate(id) {
    const { data } = await db().from("candidates").select("*").eq("id", id).maybeSingle();
    return data ? candidateFromRow(data) : undefined;
  },
  async getCandidateByEditToken(token) {
    const { data } = await db().from("candidates").select("*").eq("edit_token", token).maybeSingle();
    return data ? candidateFromRow(data) : undefined;
  },
  async addCandidate(c) {
    const { error } = await db().from("candidates").insert(candidateToRow(c));
    assertOk("addCandidate", error);
  },
  async updateCandidate(id, patch) {
    const { data, error } = await db()
      .from("candidates")
      .update(candidateToRow(patch))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    assertOk("updateCandidate", error);
    return data ? candidateFromRow(data) : undefined;
  },

  async listOpenToMatchingCandidates() {
    const { data } = await db()
      .from("candidates")
      .select("*")
      .eq("open_to_matching", true)
      .order("created_at", { ascending: false });
    return (data ?? []).map(candidateFromRow);
  },
  async listAllOpenJobs() {
    const { data } = await db()
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    return (data ?? []).map(jobFromRow);
  },

  async listJobs(recruiterId) {
    const { data } = await db()
      .from("jobs")
      .select("*")
      .eq("recruiter_id", recruiterId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(jobFromRow);
  },
  async getJob(id) {
    const { data } = await db().from("jobs").select("*").eq("id", id).maybeSingle();
    return data ? jobFromRow(data) : undefined;
  },
  async addJob(j) {
    const { error } = await db().from("jobs").insert({
      id: j.id,
      recruiter_id: j.recruiterId,
      title: j.title,
      requirement: j.requirement,
      salary_range: j.salaryRange ?? "",
      status: j.status,
      created_at: j.createdAt,
    });
    assertOk("addJob", error);
  },
  async updateJob(id, patch) {
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.requirement !== undefined) row.requirement = patch.requirement;
    if (patch.salaryRange !== undefined) row.salary_range = patch.salaryRange;
    if (patch.status !== undefined) row.status = patch.status;
    const { data, error } = await db().from("jobs").update(row).eq("id", id).select("*").maybeSingle();
    assertOk("updateJob", error);
    return data ? jobFromRow(data) : undefined;
  },

  async getUserByEmail(email) {
    const { data } = await db()
      .from("users")
      .select("*")
      .ilike("email", email)
      .maybeSingle();
    return data ? userFromRow(data) : undefined;
  },
  async getUserById(id) {
    const { data } = await db().from("users").select("*").eq("id", id).maybeSingle();
    return data ? userFromRow(data) : undefined;
  },
  async addUser(u) {
    const { error } = await db().from("users").insert({
      id: u.id,
      email: u.email,
      password_hash: u.passwordHash,
      name: u.name,
      created_at: u.createdAt,
    });
    assertOk("addUser", error);
  },
  async updateUser(id, patch) {
    const row: Record<string, unknown> = {};
    if (patch.email !== undefined) row.email = patch.email;
    if (patch.passwordHash !== undefined) row.password_hash = patch.passwordHash;
    if (patch.name !== undefined) row.name = patch.name;
    const { data, error } = await db().from("users").update(row).eq("id", id).select("*").maybeSingle();
    assertOk("updateUser", error);
    return data ? userFromRow(data) : undefined;
  },

  async addSession(s) {
    const { error } = await db()
      .from("sessions")
      .insert({ token: s.token, user_id: s.userId, created_at: s.createdAt });
    assertOk("addSession", error);
  },
  async getSession(token) {
    const { data } = await db().from("sessions").select("*").eq("token", token).maybeSingle();
    return data ? { token: data.token, userId: data.user_id, createdAt: data.created_at } : undefined;
  },
  async deleteSession(token) {
    await db().from("sessions").delete().eq("token", token);
  },

  async addResetToken(t) {
    await db().from("reset_tokens").delete().eq("user_id", t.userId);
    const { error } = await db()
      .from("reset_tokens")
      .insert({ token: t.token, user_id: t.userId, expires_at: t.expiresAt });
    assertOk("addResetToken", error);
  },
  async getResetToken(token) {
    const { data } = await db().from("reset_tokens").select("*").eq("token", token).maybeSingle();
    return data ? { token: data.token, userId: data.user_id, expiresAt: data.expires_at } : undefined;
  },
  async deleteResetToken(token) {
    await db().from("reset_tokens").delete().eq("token", token);
  },

  async addNotification(n) {
    const { error } = await db().from("notifications").insert({
      id: n.id,
      audience: n.audience,
      type: n.type,
      message: n.message,
      candidate_id: n.candidateId ?? null,
      read: n.read,
      created_at: n.createdAt,
    });
    assertOk("addNotification", error);
  },
  async listNotifications(audience) {
    const { data } = await db()
      .from("notifications")
      .select("*")
      .eq("audience", audience)
      .order("created_at", { ascending: false });
    return (data ?? []).map(notificationFromRow);
  },
  async markNotificationsRead(audience) {
    await db().from("notifications").update({ read: true }).eq("audience", audience);
  },
};
