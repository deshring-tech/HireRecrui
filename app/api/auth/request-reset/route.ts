import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addResetToken, getUserByEmail } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { bucket: "request-reset", limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const { email } = await req.json();
  const user = email ? await getUserByEmail(email) : undefined;

  // Always respond the same way so this can't be used to probe which emails exist.
  if (user) {
    const token = randomUUID();
    await addResetToken({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    });

    const origin = req.nextUrl.origin;
    const link = `${origin}/reset?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your HireFlow password",
      body: `Click to reset your password (valid for 1 hour): ${link}`,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link has been sent.",
  });
}
