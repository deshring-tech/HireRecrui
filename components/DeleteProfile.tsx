"use client";

import { useState } from "react";

// Lets a candidate permanently delete their own profile from their private link.
export default function DeleteProfile({ token, onDeleted }: { token: string; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/candidates/by-token/${token}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't delete your profile. Please try again.");
        return;
      }
      onDeleted();
    } catch {
      setError("Couldn't delete your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-12 border-t border-slate-100 pt-6">
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="text-sm text-rose-600 hover:text-rose-700">
          Delete my profile
        </button>
      ) : (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-800">Delete this profile permanently?</p>
          <p className="text-sm text-rose-700 mt-1">
            Your profile, its public link, notifications, and uploaded files will be removed. This can't be undone.
          </p>
          {error && <p className="text-sm text-rose-800 mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={remove} disabled={busy} className="btn-danger">
              {busy ? "Deleting..." : "Yes, delete everything"}
            </button>
            <button onClick={() => setConfirming(false)} disabled={busy} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
