"use client";

import { useEffect, useRef } from "react";

// Fires once per page load. Kept as a client beacon rather than a server-render
// side effect so prefetches and re-renders don't inflate the count.
export default function ProfileViewTracker({ candidateId }: { candidateId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
      keepalive: true,
    }).catch(() => {
      /* view tracking is best-effort — never block the page */
    });
  }, [candidateId]);

  return null;
}
