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
    if (!recruiterId) {
      setCtx({ valid: false });
      return;
    }
    fetch(`/api/public/intake?r=${recruiterId}&job=${jobId}`)
      .then((r) => r.json())
      .then(setCtx)
      .catch(() => setCtx({ valid: false }));
  }, [recruiterId, jobId]);

  return (
    <main>
      <NavBar />
      <section className="max-w-2xl mx-auto px-6 pb-24">
        {ctx === null && <p className="text-slate-400 text-sm">Loading...</p>}

        {ctx && !ctx.valid && (
          <div className="text-sm bg-amber-50 text-amber-700 border border-amber-100 rounded-xl px-4 py-3">
            This intake link isn't tied to a valid recruiter. Ask them for their personalized link so your profile
            lands in the right place.
          </div>
        )}

        {ctx && ctx.valid && (
          <CandidateWizard
            mode="create"
            recruiterId={recruiterId}
            jobId={ctx.job?.id}
            recruiterName={ctx.recruiterName}
            jobTitle={ctx.job?.title}
          />
        )}
      </section>
    </main>
  );
}
