"use client";

type Props = {
  status: "new" | "accepted" | "rejected" | "interview";
  viewCount: number;
  viewedAt: string | null;
  decisionReason: string | null;
  hasRecruiter: boolean;
  profileUrl: string;
};

const STATUS_COPY: Record<Props["status"], { label: string; tone: string; note: string }> = {
  new: {
    label: "Awaiting review",
    tone: "bg-slate-100 text-slate-600",
    note: "Your profile has been submitted and is waiting on the recruiter.",
  },
  accepted: {
    label: "Accepted",
    tone: "bg-emerald-100 text-emerald-700",
    note: "The recruiter marked you as accepted. Expect to hear from them directly.",
  },
  interview: {
    label: "Interview requested",
    tone: "bg-amber-100 text-amber-700",
    note: "The recruiter wants to move you forward to an interview.",
  },
  rejected: {
    label: "Not moving forward",
    tone: "bg-rose-100 text-rose-700",
    note: "The recruiter decided not to proceed this time. Your profile stays yours to reuse.",
  },
};

export default function CandidateStatusPanel(props: Props) {
  const { status, viewCount, viewedAt, decisionReason, hasRecruiter, profileUrl } = props;
  const copy = STATUS_COPY[status];

  return (
    <div className="card p-5 mb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="section-title mb-1">Your application</p>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${copy.tone}`}>{copy.label}</span>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          View public profile →
        </a>
      </div>

      <p className="text-sm text-slate-600 mt-3">{hasRecruiter ? copy.note : "This is your own shareable profile — share the link with any recruiter."}</p>

      {decisionReason && (
        <p className="text-sm text-slate-600 mt-2">
          <span className="font-medium text-slate-700">Note from the recruiter:</span> {decisionReason}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div>
          <span className="font-semibold text-slate-800">{viewCount}</span>{" "}
          <span className="text-slate-500">profile {viewCount === 1 ? "view" : "views"}</span>
        </div>
        {viewedAt ? (
          <div className="text-emerald-700">
            ✓ A recruiter opened your profile on {new Date(viewedAt).toLocaleDateString()}
          </div>
        ) : hasRecruiter ? (
          <div className="text-slate-400">No recruiter has opened it yet</div>
        ) : null}
      </div>
    </div>
  );
}
