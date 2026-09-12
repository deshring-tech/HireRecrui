"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Lets a recruiter delete their account. Requires typing DELETE, enforced server-side too.
export default function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't delete your account. Please try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Couldn't delete your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-slate-100 pt-6 mt-6">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-sm text-rose-600 hover:text-rose-700">
          Delete account
        </button>
      ) : (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-800">Delete your recruiter account?</p>
          <ul className="text-sm text-rose-700 mt-2 list-disc pl-5 space-y-1">
            <li>Your account and all your roles are deleted.</li>
            <li>Résumés you bulk-uploaded are deleted.</li>
            <li>
              Profiles candidates submitted to you are detached from your account — your scores and decisions are
              removed — and stay with the candidate.
            </li>
          </ul>
          <p className="text-sm text-rose-700 mt-3">
            Type <strong>DELETE</strong> to confirm. This can't be undone.
          </p>
          <input
            className="input mt-2 bg-white"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
          />
          {error && <p className="text-sm text-rose-800 mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={remove} disabled={busy || typed !== "DELETE"} className="btn-danger">
              {busy ? "Deleting..." : "Delete my account"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError("");
              }}
              disabled={busy}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
