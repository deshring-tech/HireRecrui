"use client";

import { useState } from "react";

export default function CopyLinkButton({ text, label = "Copy link" }: { text?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="btn-secondary text-sm"
      onClick={() => {
        navigator.clipboard.writeText(text ?? window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
