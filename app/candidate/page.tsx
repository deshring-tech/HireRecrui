"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "@/components/NavBar";
import CandidateWizard from "@/components/CandidateWizard";

export default function CandidatePage() {
  return (
    <Suspense
      fallback={
        <main>
          <NavBar />
          <p className="text-center text-slate-400 text-sm mt-10">Loading...</p>
        </main>
      }
    >
      <CandidateEntry />
    </Suspense>
  );
}

function CandidateEntry() {
  const searchParams = useSearchParams();
  const recruiterId = searchParams.get("r") || "";
  const jobId = searchParams.get("job") || "";

  const [ctx, setCtx] = useState<{ valid: boolean; recruiterName?: string; job?: { id: string; title: string } | null } | null>(
    null
  );

  useEffect(() => {
    // No recruiter link → self-serve mode (candidate builds a free-floating profile).
    if (!recruiterId) {
      setCtx({ valid: false });
      return;
    }
    fetch(`/api/public/intake?r=${recruiterId}&job=${jobId}`)
      .then((r) => r.json())
      .then(setCtx)
      .catch(() => setCtx({ valid: false }));
  }, [recruiterId, jobId]);

  // Self-serve: someone arrived at /candidate with no ?r= at all.
  const selfServe = !recruiterId;

  return (
    <main>
      <NavBar />
      <section className="max-w-2xl mx-auto px-6 pb-24">
        {ctx === null && <p className="text-slate-400 text-sm">Loading...</p>}

        {/* Only warn when a recruiter link was provided but is invalid. */}
        {ctx && !ctx.valid && !selfServe && (
          <div className="text-sm bg-amber-50 text-amber-700 border border-amber-100 rounded-xl px-4 py-3">
            This intake link isn't tied to a valid recruiter. You can still build your profile below and share it
            yourself.
          </div>
        )}

        {/* Self-serve mode: build a shareable profile with no recruiter. */}
        {ctx && selfServe && <CandidateWizard mode="create" />}

        {/* Recruiter-collected mode. */}
        {ctx && !selfServe && ctx.valid && (
          <CandidateWizard
            mode="create"
            recruiterId={recruiterId}
            jobId={ctx.job?.id}
            recruiterName={ctx.recruiterName}
            jobTitle={ctx.job?.title}
          />
        )}

        {/* Recruiter link present but invalid → still let them self-serve. */}
        {ctx && !selfServe && !ctx.valid && <CandidateWizard mode="create" />}
      </section>
    </main>
  );
}
