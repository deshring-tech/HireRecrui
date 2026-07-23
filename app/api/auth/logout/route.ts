import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { endSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) await endSession(token);
  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
