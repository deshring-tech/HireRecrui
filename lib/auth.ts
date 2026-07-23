import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { addSession, deleteSession, getSession, getUserById, User } from "@/lib/db";

export const SESSION_COOKIE = "hf_session";

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
  return (await getUserById(session.userId)) || null;
}
