import { NextResponse } from "next/server";
import { listNotifications, markNotificationsRead } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ notifications: await listNotifications(user.id) });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  await markNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}
