"use client";

import { useEffect, useState } from "react";

type Match = {
  jobId: string;
  title: string;
  salaryRange: string;
  recruiterName: string;
  applyPath: string;
  score: { value: number; label: string; reasons: string[] };
};

const SCORE_STYLE: Record<string, string> = {
  "High Match": "bg-emerald-100 text-emerald-700",
  "Needs Review": "bg-amber-100 text-amber-700",
  "Low Match": "bg-rose-100 text-rose-700",
};

export default function MatchingRoles({ token, optedIn }: { token: string; optedIn: boolean }) {
  const [matches, setMatches] = useState<Match[] | null>(null);

  useEffect(() => {
    if (!optedIn) return;
    fetch(`/api/matches/by-token/${token}`)
      .then((r) => r.json())
      .then((d) => setMatches(d.matches || []))
      .catch(() => setMatches([]));
  }, [token, optedIn]);

  if (!optedIn) {
    return (
      <div className="card p-5 mb-8">
        <p className="section-title mb-2">Roles matching you</p>
        <p className="text-sm text-slate-500">
          Turn on <strong>“Match me to other open roles”</strong> below to see roles you're a strong fit for, and let
          recruiters find you.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5 mb-8">
      <p className="section-title mb-3">Roles matching you</p>

      {matches === null && <p className="text-sm text-slate-400">Finding matches...</p>}

      {matches?.length === 0 && (
        <p className="text-sm text-slate-500">
          No strong matches open right now. We only show roles you genuinely fit — you'll see new ones here as
          recruiters post them.
        </p>
      )}

      <div className="space-y-3">
        {matches?.map((m) => (
          <div key={m.jobId} className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <p className="font-medium text-slate-900">{m.title}</p>
                <p className="text-xs text-slate-400">
                  {m.recruiterName}
                  {m.salaryRange ? ` · ${m.salaryRange}` : ""}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SCORE_STYLE[m.score.label] || ""}`}>
                {m.score.label} · {m.score.value}
              </span>
            </div>
            {m.score.reasons?.length > 0 && (
              <p className="text-xs text-slate-500 mt-2">{m.score.reasons[0]}</p>
            )}
            <a href={m.applyPath} className="text-xs font-medium text-brand-600 hover:text-brand-700 mt-2 inline-block">
              Apply with my profile →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
