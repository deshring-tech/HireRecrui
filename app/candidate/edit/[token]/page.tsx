"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import CandidateWizard, { WizardInitial } from "@/components/CandidateWizard";
import CandidateStatusPanel from "@/components/CandidateStatusPanel";
import MatchingRoles from "@/components/MatchingRoles";
import DeleteProfile from "@/components/DeleteProfile";

type StatusInfo = {
  id: string;
  status: "new" | "accepted" | "rejected" | "interview";
  viewCount: number;
  viewedAt: string | null;
  decisionReason: string | null;
  hasRecruiter: boolean;
  openToMatching: boolean;
};

export default function EditCandidatePage({ params }: { params: { token: string } }) {
  const [state, setState] = useState<"loading" | "notfound" | "ready" | "deleted">("loading");
  const [initial, setInitial] = useState<WizardInitial | null>(null);
  const [info, setInfo] = useState<StatusInfo | null>(null);

  useEffect(() => {
    fetch(`/api/candidates/by-token/${params.token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const c = data.candidate;
        setInitial({
          name: c.name,
          title: c.title,
          email: c.email,
          rawResume: c.rawResume,
          projects: c.projects,
          style: c.style,
          openToMatching: Boolean(c.openToMatching),
        });
        setInfo({
          id: c.id,
          status: c.status,
          viewCount: c.viewCount ?? 0,
          viewedAt: c.viewedAt ?? null,
          decisionReason: c.decisionReason ?? null,
          hasRecruiter: Boolean(c.hasRecruiter),
          openToMatching: Boolean(c.openToMatching),
        });
        setState("ready");
      })
      .catch(() => setState("notfound"));
  }, [params.token]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main>
      <NavBar />
      <section className="max-w-2xl mx-auto px-6 pb-24">
        {state === "loading" && <p className="text-slate-400 text-sm">Loading your profile...</p>}
        {state === "notfound" && (
          <div className="text-sm bg-rose-50 text-rose-600 border border-rose-100 rounded-xl px-4 py-3">
            This edit link is no longer valid.
          </div>
        )}
        {state === "deleted" && (
          <div className="card p-6 text-center">
            <p className="font-medium text-slate-900">Your profile has been deleted.</p>
            <p className="text-sm text-slate-500 mt-1">Its public link and private link no longer work.</p>
            <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-700 mt-3 inline-block">
              Back to HireFlow AI
            </Link>
          </div>
        )}
        {state === "ready" && info && (
          <CandidateStatusPanel
            status={info.status}
            viewCount={info.viewCount}
            viewedAt={info.viewedAt}
            decisionReason={info.decisionReason}
            hasRecruiter={info.hasRecruiter}
            profileUrl={`${origin}/r/${info.id}`}
          />
        )}
        {state === "ready" && info && <MatchingRoles token={params.token} optedIn={info.openToMatching} />}
        {state === "ready" && initial && (
          <CandidateWizard mode="edit" editToken={params.token} initial={initial} />
        )}
        {state === "ready" && <DeleteProfile token={params.token} onDeleted={() => setState("deleted")} />}
      </section>
    </main>
  );
}
