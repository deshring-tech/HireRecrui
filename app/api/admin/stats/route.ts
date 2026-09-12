import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { adminRows } from "@/lib/db";
import { computeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // 404 rather than 403, so the page's existence isn't advertised to non-admins.
  if (!adminEmails().includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const target = Number.parseInt(process.env.LAUNCH_GOAL_RETAINED_RECRUITERS || "", 10);

  try {
    const stats = computeStats(await adminRows(), Date.now(), Number.isFinite(target) && target > 0 ? target : 10);
    return NextResponse.json({ stats });
  } catch (err) {
    console.error("[admin] stats failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Couldn't load stats. If you just deployed, run the latest database migrations." },
      { status: 500 }
    );
  }
}
