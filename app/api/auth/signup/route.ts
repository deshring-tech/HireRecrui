import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { addUser, getUserByEmail } from "@/lib/db";
import { createSession, hashPassword, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "signup", limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const { email, password, name } = await req.json();

  if (!email?.trim() || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Enter a valid email and a password of at least 6 characters." },
      { status: 400 }
    );
  }

  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const user = {
    id: randomUUID(),
    email: email.trim().toLowerCase(),
    passwordHash: await hashPassword(password),
    name: name?.trim() || email.split("@")[0],
    createdAt: new Date().toISOString(),
  };
  await addUser(user);

  const token = await createSession(user.id);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
