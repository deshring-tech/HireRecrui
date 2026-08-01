"use client";

import { useEffect, useState } from "react";

type Status = "new" | "accepted" | "rejected" | "interview";

const STATUS_STYLE: Record<Status, string> = {
  new: "bg-slate-100 text-slate-500",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  interview: "bg-amber-100 text-amber-700",
};

const STATUS_LABEL: Record<Status, string> = {
  new: "Not reviewed",
  accepted: "Accepted",
  rejected: "Rejected",
  interview: "Interview requested",
};

export default function DecisionButtons({
  candidateId,
  recruiterId,
  initialStatus,
  compact = false,
}: {
  candidateId: string;
  recruiterId: string | null;
  initialStatus: Status;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [confirmingReject, setConfirmingReject] = useState(false);

  useEffect(() => {
    if (!recruiterId) return; // self-serve profile — no owning recruiter
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsOwner(d.user?.id === recruiterId))
      .catch(() => setIsOwner(false));
  }, [recruiterId]);

  async function decide(next: Status, sendFeedback = false) {
    setBusy(true);
    setStatus(next);
    setConfirmingReject(false);
    try {
      await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, sendFeedback }),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-3"}>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[status]}`}>
        {STATUS_LABEL[status]}
      </span>
      {isOwner && (
        <div className={`flex gap-2 ${compact ? "" : "mt-2"}`}>
          <button
            onClick={() => decide("accepted")}
            disabled={busy}
            className="btn-success !px-3 !py-1.5 text-xs"
            title="Accept candidate"
          >
            ✓ Accept
          </button>
          <button
            onClick={() => decide("interview")}
            disabled={busy}
            className="btn-secondary !px-3 !py-1.5 text-xs"
            title="Move to human interview"
          >
            👤 Interview
          </button>
          {confirmingReject ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => decide("rejected", true)}
                disabled={busy}
                className="btn-danger !px-3 !py-1.5 text-xs"
                title="Reject and email the candidate constructive feedback"
              >
                Reject + send feedback
              </button>
              <button
                onClick={() => decide("rejected", false)}
                disabled={busy}
                className="btn-secondary !px-3 !py-1.5 text-xs"
                title="Reject without feedback"
              >
                Reject only
              </button>
              <button
                onClick={() => setConfirmingReject(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingReject(true)}
              disabled={busy}
              className="btn-danger !px-3 !py-1.5 text-xs"
              title="Reject candidate"
            >
              ✕ Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}
