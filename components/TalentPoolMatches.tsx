"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PoolCandidate = {
  id: string;
  name: string;
  title: string;
  summary: string;
  skills: string[];
  email: string;
  verifiedLinks: number;
  score: { value: number; label: string; reasons: string[] };
};

type JobMatch = { jobId: string; jobTitle: string; candidates: PoolCandidate[] };

const SCORE_STYLE: Record<string, string> = {
  "High Match": "bg-emerald-100 text-emerald-700",
  "Needs Review": "bg-amber-100 text-amber-700",
  "Low Match": "bg-rose-100 text-rose-700",
};

export default function TalentPoolMatches() {
  const [data, setData] = useState<{ matches: JobMatch[]; reason?: string; poolSize?: number } | null>(null);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ matches: [] }));
  }, []);

  if (!data) return null;

  const total = data.matches.reduce((n, m) => n + m.candidates.length, 0);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <label className="label mb-0">Matches from the talent pool</label>
        {typeof data.poolSize === "number" && (
          <span className="text-xs text-slate-400">{data.poolSize} opted-in candidates</span>
        )}
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Candidates outside your pipeline who opted into matching and score well against your open roles. Nothing is
        auto-actioned — reviewing and reaching out stays your call.
      </p>

      {data.reason === "no-open-roles" && (
        <p className="text-sm text-slate-500">Create an open role to start seeing matches.</p>
      )}

      {data.reason !== "no-open-roles" && total === 0 && (
        <p className="text-sm text-slate-500">
          No strong matches yet. We only surface candidates above a real fit threshold, so this stays signal rather
          than noise.
        </p>
      )}

      <div className="space-y-4">
        {data.matches
          .filter((m) => m.candidates.length > 0)
          .map((m) => (
            <div key={m.jobId}>
              <p className="text-xs font-medium text-slate-500 mb-2">For {m.jobTitle}</p>
              <div className="space-y-2">
                {m.candidates.map((c) => (
                  <div key={c.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/r/${c.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                            {c.name}
                          </Link>
                          <span className="text-xs text-slate-400">{c.title}</span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${SCORE_STYLE[c.score.label] || ""}`}
                          >
                            {c.score.label} · {c.score.value}
                          </span>
                          {c.verifiedLinks > 0 && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ verified work
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{c.summary}</p>
                        {c.score.reasons?.[0] && (
                          <p className="text-xs text-slate-400 mt-1">{c.score.reasons[0]}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {c.email && (
                          <a
                            href={`mailto:${c.email}?subject=${encodeURIComponent(
                              `Opportunity: ${m.jobTitle}`
                            )}&body=${encodeURIComponent(`Hi ${c.name.split(" ")[0]},\n\n`)}`}
                            className="btn-secondary !px-3 !py-1.5 text-xs"
                          >
                            ✉ Reach out
                          </a>
                        )}
                        <Link
                          href={`/r/${c.id}`}
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
