import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByEmail } from "@/lib/db";
import { createSession, verifyPassword, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "login", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const { email, password } = await req.json();

  const user = email ? await getUserByEmail(email) : undefined;
  if (!user || !(await verifyPassword(password || "", user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

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
