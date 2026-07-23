"use client";

import { useEffect, useState } from "react";

// Shows a one-click "Email" shortcut, but ONLY to the recruiter who owns this
// candidate — the public profile page must never leak the candidate's email to
// anonymous visitors. Ownership is confirmed against the session, same as the
// decision buttons.
export default function EmailCandidateButton({
  recruiterId,
  email,
  candidateName,
  role,
  compact = false,
}: {
  recruiterId: string;
  email: string;
  candidateName: string;
  role?: string;
  compact?: boolean;
}) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsOwner(d.user?.id === recruiterId))
      .catch(() => setIsOwner(false));
  }, [recruiterId]);

  if (!isOwner || !email) return null;

  const firstName = candidateName?.split(" ")[0] || "there";
  const subject = role ? `Regarding your application for ${role}` : "Regarding your HireFlow profile";
  const body = `Hi ${firstName},\n\n`;
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <a
      href={href}
      className={
        compact
          ? "btn-secondary !px-3 !py-1.5 text-xs"
          : "btn-secondary text-sm"
      }
      title={`Email ${email}`}
    >
      ✉ Email
    </a>
  );
}
