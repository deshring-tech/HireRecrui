import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { deleteRecruiterAccount } from "@/lib/deletion";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Deletes the signed-in recruiter's account. See lib/deletion.ts for exactly what
// is removed versus handed back to candidates.
export async function DELETE(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "account-delete", limit: 3, windowMs: 60_000 });
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });
  }

  try {
    const result = await deleteRecruiterAccount(user.id);
    cookies().delete(SESSION_COOKIE);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[account] deletion failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Couldn't finish deleting your account. Please try again." },
      { status: 500 }
    );
  }
}
