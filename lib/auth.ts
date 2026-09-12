import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { addSession, deleteSession, getSession, getUserById, updateUser, User } from "@/lib/db";

export const SESSION_COOKIE = "hf_session";

const LAST_SEEN_THROTTLE_MS = 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomUUID();
  await addSession({ token, userId, createdAt: new Date().toISOString() });
  return token;
}

export async function endSession(token: string): Promise<void> {
  await deleteSession(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  const user = await getUserById(session.userId);
  if (!user) return null;
  await touchLastSeen(user);
  return user;
}

// Records recruiter activity at most once an hour. Sessions last 30 days, so login
// events alone would miss everyone who simply comes back while still signed in —
// and "do recruiters come back?" is the question the launch is meant to answer.
// Best-effort: a failure here (e.g. column not migrated yet) must never break auth.
async function touchLastSeen(user: User): Promise<void> {
  const last = user.lastSeenAt ? Date.parse(user.lastSeenAt) : 0;
  if (Date.now() - last < LAST_SEEN_THROTTLE_MS) return;
  try {
    await updateUser(user.id, { lastSeenAt: new Date().toISOString() });
  } catch (err) {
    console.error("[auth] last-seen update skipped:", (err as Error).message);
  }
}
