"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import DecisionButtons from "@/components/DecisionButtons";
import EmailCandidateButton from "@/components/EmailCandidateButton";
import CopyLinkButton from "@/components/CopyLinkButton";
import NotificationBell from "@/components/NotificationBell";
import type { Candidate, Job } from "@/lib/db";

const SCORE_STYLE: Record<string, string> = {
  "High Match": "bg-emerald-100 text-emerald-700",
  "Needs Review": "bg-amber-100 text-amber-700",
  "Low Match": "bg-rose-100 text-rose-700",
};

type MeUser = { id: string; email: string; name: string };

export default function RecruiterPage() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<string>("all"); // "all" | "none" | jobId
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newReq, setNewReq] = useState("");
  const [requirement, setRequirement] = useState("");

  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: string[]; hadOpenJobs: boolean } | null>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (!meData.user) {
        router.push("/login");
        return;
      }
      setUser(meData.user);
      await Promise.all([loadCandidates(), loadJobs()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function loadCandidates() {
    const res = await fetch("/api/candidates");
    const data = await res.json();
    setCandidates(data.candidates || []);
  }

  async function loadJobs() {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setJobs(data.jobs || []);
  }

  // Keep the requirement box in sync with the selected role.
  useEffect(() => {
    const job = jobs.find((j) => j.id === activeJob);
    setRequirement(job ? job.requirement : "");
  }, [activeJob, jobs]);

  async function createJob() {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, requirement: newReq }),
    });
    const data = await res.json();
    if (res.ok) {
      setJobs((prev) => [data.job, ...prev]);
      setActiveJob(data.job.id);
      setNewTitle("");
      setNewReq("");
      setCreating(false);
    }
  }

  async function scoreAll() {
    setScoring(true);
    try {
      const body =
        activeJob !== "all" && activeJob !== "none"
          ? { jobId: activeJob, jobRequirement: requirement }
          : { jobRequirement: requirement };
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) setCandidates(data.candidates);
      await loadJobs();
    } finally {
      setScoring(false);
    }
  }

  async function handleBulkFiles(files: FileList) {
    if (!files.length) return;
    setBulkBusy(true);
    setBulkResult(null);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/bulk", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setBulkResult({ created: data.created, skipped: data.skipped || [], hadOpenJobs: data.hadOpenJobs });
        await Promise.all([loadCandidates(), loadJobs()]);
      } else {
        setBulkResult({ created: 0, skipped: [data.error || "Upload failed"], hadOpenJobs: true });
      }
    } finally {
      setBulkBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const baseLink = user ? `${origin}/candidate?r=${user.id}` : "";
  const intakeLink =
    activeJob !== "all" && activeJob !== "none" ? `${baseLink}&job=${activeJob}` : baseLink;

  const scoped = candidates.filter((c) => {
    if (activeJob === "all") return true;
    if (activeJob === "none") return !c.jobId;
    return c.jobId === activeJob;
  });
  const sorted = [...scoped].sort((a, b) => (b.score?.value ?? -1) - (a.score?.value ?? -1));

  const countFor = (jobId: string | null) =>
    candidates.filter((c) => (jobId === null ? !c.jobId : c.jobId === jobId)).length;

  if (!user) {
    return (
      <main>
        <NavBar />
        <p className="text-center text-slate-400 text-sm mt-10">Loading...</p>
      </main>
    );
  }

  return (
    <main>
      <NavBar
        right={
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button onClick={logout} className="text-sm text-slate-400 hover:text-slate-600">
              Log out
            </button>
          </div>
        }
      />
      <section className="max-w-4xl mx-auto px-6 pb-24 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Recruiter dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Screen every candidate's real work in a couple of clicks.</p>
        </div>

        {/* Role selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <Chip active={activeJob === "all"} onClick={() => setActiveJob("all")}>
            All ({candidates.length})
          </Chip>
          {jobs.map((j) => (
            <Chip key={j.id} active={activeJob === j.id} onClick={() => setActiveJob(j.id)}>
              {j.title} ({countFor(j.id)})
            </Chip>
          ))}
          <Chip active={activeJob === "none"} onClick={() => setActiveJob("none")}>
            No role ({countFor(null)})
          </Chip>
          <button
            onClick={() => setCreating((v) => !v)}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 px-2"
          >
            + New role
          </button>
        </div>

        {creating && (
          <div className="card p-5 space-y-3">
            <div>
              <label className="label">Role title</label>
              <input
                className="input"
                placeholder="e.g. Senior Backend Engineer"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="label">What are you hiring for? (skills / requirements)</label>
              <input
                className="input"
                placeholder="e.g. Python, Django, PostgreSQL, 3+ years, deployed production experience"
                value={newReq}
                onChange={(e) => setNewReq(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={createJob} disabled={!newTitle.trim()} className="btn-primary">
                Create role
              </button>
              <button onClick={() => setCreating(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Intake link for the active scope */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">
              {activeJob !== "all" && activeJob !== "none"
                ? "Intake link for this role"
                : "Your general intake link"}
            </label>
            <CopyLinkButton text={intakeLink} />
          </div>
          <p className="text-xs text-slate-400 break-all">{intakeLink}</p>
          <p className="text-xs text-slate-400 mt-1">
            Share this with candidates — submissions land only in your dashboard
            {activeJob !== "all" && activeJob !== "none" ? ", tagged to this role." : "."}
          </p>
        </div>

        {/* Scoring */}
        <div className="card p-5">
          <label className="label">
            {activeJob !== "all" && activeJob !== "none"
              ? "Requirement for this role"
              : "Score everyone against a requirement"}
          </label>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="e.g. Backend engineer, 2+ years, Python + Postgres, deployed production experience"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
            />
            <button onClick={scoreAll} disabled={scoring} className="btn-primary shrink-0">
              {scoring ? "Scoring..." : "Score candidates"}
            </button>
          </div>
        </div>

        {/* Bulk resume upload → auto-match */}
        <div className="card p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <label className="label mb-0">Bulk-upload resumes</label>
              <p className="text-xs text-slate-400 mt-1">
                Drop in a stack of resumes (PDF / DOCX / TXT). Each is auto-profiled, scored against your open
                roles, and routed to the best fit. You make every decision.
              </p>
            </div>
            <button
              onClick={() => bulkInputRef.current?.click()}
              disabled={bulkBusy}
              className="btn-primary shrink-0"
            >
              {bulkBusy ? "Processing..." : "⬆ Upload resumes"}
            </button>
            <input
              ref={bulkInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleBulkFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {bulkResult && (
            <div className="mt-4 text-sm rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-slate-700 font-medium">
                {bulkResult.created > 0
                  ? `Added ${bulkResult.created} candidate${bulkResult.created > 1 ? "s" : ""}, ranked and routed.`
                  : "No candidates were added."}
              </p>
              {!bulkResult.hadOpenJobs && bulkResult.created > 0 && (
                <p className="text-amber-600 text-xs mt-1">
                  You have no open roles yet — candidates were added unassigned. Create a role and click "Score
                  candidates" to match them.
                </p>
              )}
              {bulkResult.skipped.length > 0 && (
                <p className="text-slate-400 text-xs mt-1">Skipped: {bulkResult.skipped.join(", ")}</p>
              )}
            </div>
          )}
        </div>

        {loading && <p className="text-slate-400 text-sm">Loading candidates...</p>}

        {!loading && sorted.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-slate-500">No candidates in this view yet.</p>
            <p className="text-slate-400 text-xs mt-2">Share the intake link above to start collecting profiles.</p>
          </div>
        )}

        <div className="space-y-3">
          {sorted.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/r/${c.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                      {c.profile.name}
                    </Link>
                    <span className="text-xs text-slate-400">{c.profile.title}</span>
                    {c.score && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SCORE_STYLE[c.score.label]}`}>
                        {c.score.label} · {c.score.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{c.profile.summary}</p>
                  {c.score?.reasons?.length ? (
                    <ul className="text-xs text-slate-400 mt-2 list-disc list-inside space-y-0.5">
                      {c.score.reasons.slice(0, 2).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Link href={`/r/${c.id}`} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                    View full profile →
                  </Link>
                  <div className="flex items-center gap-2">
                    <EmailCandidateButton
                      recruiterId={c.recruiterId}
                      email={c.email}
                      candidateName={c.profile.name}
                      role={jobs.find((j) => j.id === c.jobId)?.title}
                      compact
                    />
                    <DecisionButtons
                      candidateId={c.id}
                      recruiterId={c.recruiterId}
                      initialStatus={c.status}
                      compact
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3 py-1.5 rounded-full transition ${
        active ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
