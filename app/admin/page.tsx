"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";

type Stats = {
  generatedAt: string;
  goal: { target: number; retainedRecruiters: number };
  recruiters: { total: number; newLast7d: number; activeLast7d: number; eligibleForRetention: number; retainedWeek2: number };
  candidates: {
    total: number;
    newLast7d: number;
    bySource: { self: number; link: number; bulk: number; unknown: number };
    viewed: number;
    openToMatching: number;
    decided: number;
  };
  jobs: { total: number; open: number };
  daily: { date: string; recruiters: number; candidates: number }[];
};

function pct(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";
}

function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "notfound" | "error" | "ready">("loading");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (r.status === 401) return router.push("/login");
        if (r.status === 404) return setState("notfound");
        const data = await r.json();
        if (!r.ok) {
          setError(data.error || "Couldn't load stats.");
          return setState("error");
        }
        setStats(data.stats);
        setState("ready");
      })
      .catch(() => {
        setError("Couldn't load stats.");
        setState("error");
      });
  }, [router]);

  return (
    <main>
      <NavBar />
      <section className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        {state === "loading" && <p className="text-sm text-slate-400">Loading...</p>}
        {state === "notfound" && <p className="text-sm text-slate-500">Page not found.</p>}
        {state === "error" && <p className="text-sm text-rose-600">{error}</p>}

        {state === "ready" && stats && (
          <>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Launch stats</h1>
              <p className="text-xs text-slate-400 mt-1">Updated {new Date(stats.generatedAt).toLocaleString()}</p>
            </div>

            <div className="card p-5">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <p className="label mb-0">Goal: recruiters who came back in week 2</p>
                <p className="text-sm font-medium text-slate-700">
                  {stats.goal.retainedRecruiters} / {stats.goal.target}
                </p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-brand-500"
                  style={{ width: `${Math.min(100, (stats.goal.retainedRecruiters / stats.goal.target) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Signups show interest. Recruiters returning a week later show the product is useful — that's the
                number that decides what to build next.
              </p>
            </div>

            <div>
              <p className="section-title">Recruiters</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Tile label="Total" value={stats.recruiters.total} />
                <Tile label="New this week" value={stats.recruiters.newLast7d} />
                <Tile label="Active this week" value={stats.recruiters.activeLast7d} />
                <Tile
                  label="Week-2 retention"
                  value={pct(stats.recruiters.retainedWeek2, stats.recruiters.eligibleForRetention)}
                  hint={`${stats.recruiters.retainedWeek2} of ${stats.recruiters.eligibleForRetention} eligible`}
                />
              </div>
            </div>

            <div>
              <p className="section-title">Candidates</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Tile label="Profiles" value={stats.candidates.total} hint={`${stats.candidates.newLast7d} this week`} />
                <Tile label="Viewed" value={pct(stats.candidates.viewed, stats.candidates.total)} hint={`${stats.candidates.viewed} profiles`} />
                <Tile label="Opted into matching" value={pct(stats.candidates.openToMatching, stats.candidates.total)} hint={`${stats.candidates.openToMatching} profiles`} />
                <Tile label="Got a decision" value={pct(stats.candidates.decided, stats.candidates.total)} hint={`${stats.candidates.decided} profiles`} />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Came from: {stats.candidates.bySource.self} self-serve · {stats.candidates.bySource.link} recruiter links ·{" "}
                {stats.candidates.bySource.bulk} bulk uploads
                {stats.candidates.bySource.unknown > 0 && ` · ${stats.candidates.bySource.unknown} untracked`}
              </p>
            </div>

            <div>
              <p className="section-title">Roles</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Tile label="Created" value={stats.jobs.total} />
                <Tile label="Open" value={stats.jobs.open} />
              </div>
            </div>

            <div className="card p-5">
              <p className="label">Last 14 days (UTC)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 text-left">
                      <th className="py-1.5 pr-4 font-medium">Date</th>
                      <th className="py-1.5 pr-4 font-medium">Recruiter signups</th>
                      <th className="py-1.5 font-medium">Candidate profiles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.daily.map((d) => (
                      <tr key={d.date} className="border-t border-slate-100">
                        <td className="py-1.5 pr-4 text-slate-500 whitespace-nowrap">{d.date}</td>
                        <td className="py-1.5 pr-4 text-slate-700">{d.recruiters}</td>
                        <td className="py-1.5 text-slate-700">{d.candidates}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
