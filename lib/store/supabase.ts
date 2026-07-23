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
      { auth: { persistSession: false } }
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
    await db().from("candidates").insert(candidateToRow(c));
  },
  async updateCandidate(id, patch) {
    const { data } = await db()
      .from("candidates")
      .update(candidateToRow(patch))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    return data ? candidateFromRow(data) : undefined;
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
    await db().from("jobs").insert({
      id: j.id,
      recruiter_id: j.recruiterId,
      title: j.title,
      requirement: j.requirement,
      status: j.status,
      created_at: j.createdAt,
    });
  },
  async updateJob(id, patch) {
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.requirement !== undefined) row.requirement = patch.requirement;
    if (patch.status !== undefined) row.status = patch.status;
    const { data } = await db().from("jobs").update(row).eq("id", id).select("*").maybeSingle();
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
    await db().from("users").insert({
      id: u.id,
      email: u.email,
      password_hash: u.passwordHash,
      name: u.name,
      created_at: u.createdAt,
    });
  },
  async updateUser(id, patch) {
    const row: Record<string, unknown> = {};
    if (patch.email !== undefined) row.email = patch.email;
    if (patch.passwordHash !== undefined) row.password_hash = patch.passwordHash;
    if (patch.name !== undefined) row.name = patch.name;
    const { data } = await db().from("users").update(row).eq("id", id).select("*").maybeSingle();
    return data ? userFromRow(data) : undefined;
  },

  async addSession(s) {
    await db().from("sessions").insert({ token: s.token, user_id: s.userId, created_at: s.createdAt });
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
    await db().from("reset_tokens").insert({ token: t.token, user_id: t.userId, expires_at: t.expiresAt });
  },
  async getResetToken(token) {
    const { data } = await db().from("reset_tokens").select("*").eq("token", token).maybeSingle();
    return data ? { token: data.token, userId: data.user_id, expiresAt: data.expires_at } : undefined;
  },
  async deleteResetToken(token) {
    await db().from("reset_tokens").delete().eq("token", token);
  },

  async addNotification(n) {
    await db().from("notifications").insert({
      id: n.id,
      audience: n.audience,
      type: n.type,
      message: n.message,
      candidate_id: n.candidateId ?? null,
      read: n.read,
      created_at: n.createdAt,
    });
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
