// Pluggable email sender. Today it logs to the server console so the whole
// notification flow works without any external service. To go live, set
// RESEND_API_KEY (or swap in SMTP) and fill in the marked block — nothing else
// in the app needs to change.

type EmailInput = { to: string; subject: string; body: string };

export async function sendEmail({ to, subject, body }: EmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `\n[email:dev] would send ->\n  to: ${to}\n  subject: ${subject}\n  body: ${body}\n`
    );
    return;
  }

  // --- swap-in point for real delivery (Resend shown as example) ---
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "HireFlow AI <onboarding@resend.dev>",
        to,
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      console.error("[email] delivery failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[email] delivery threw:", (err as Error).message);
  }
}
