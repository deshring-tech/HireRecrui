import { NextRequest, NextResponse } from "next/server";
import { deleteResetToken, getResetToken, updateUser } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "reset", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const { token, password } = await req.json();

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const record = token ? await getResetToken(token) : undefined;
  if (!record || new Date(record.expiresAt) < new Date()) {
    if (record) await deleteResetToken(record.token);
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  await updateUser(record.userId, { passwordHash: await hashPassword(password) });
  await deleteResetToken(record.token);

  return NextResponse.json({ ok: true });
}
