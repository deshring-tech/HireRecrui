"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import CandidateWizard, { WizardInitial } from "@/components/CandidateWizard";

export default function EditCandidatePage({ params }: { params: { token: string } }) {
  const [state, setState] = useState<"loading" | "notfound" | "ready">("loading");
  const [initial, setInitial] = useState<WizardInitial | null>(null);

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
        });
        setState("ready");
      })
      .catch(() => setState("notfound"));
  }, [params.token]);

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
        {state === "ready" && initial && (
          <CandidateWizard mode="edit" editToken={params.token} initial={initial} />
        )}
      </section>
    </main>
  );
}
