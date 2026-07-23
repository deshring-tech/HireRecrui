import { getCandidate, getJob } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import AskBox from "@/components/AskBox";
import DecisionButtons from "@/components/DecisionButtons";
import EmailCandidateButton from "@/components/EmailCandidateButton";
import CopyLinkButton from "@/components/CopyLinkButton";
import { notFound } from "next/navigation";

export default async function ResumePage({ params }: { params: { id: string } }) {
  const candidate = await getCandidate(params.id);
  if (!candidate) return notFound();

  const { profile } = candidate;
  const job = candidate.jobId ? await getJob(candidate.jobId) : undefined;
  const jobTitle = job?.title;

  // The public profile ships to anyone with the link. The candidate's email is
  // PII, so only include it in the payload when the viewer is the owning recruiter.
  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === candidate.recruiterId;

  return (
    <main>
      <NavBar right={<CopyLinkButton />} />
      <section className="max-w-3xl mx-auto px-6 pb-24 space-y-8">
        <div className="card p-7">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{profile.name}</h1>
              <p className="text-brand-600 font-medium">{profile.title}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <EmailCandidateButton
                recruiterId={candidate.recruiterId}
                email={isOwner ? candidate.email : ""}
                candidateName={profile.name}
                role={jobTitle}
                compact
              />
              <DecisionButtons
                candidateId={candidate.id}
                recruiterId={candidate.recruiterId}
                initialStatus={candidate.status}
                compact
              />
            </div>
          </div>
          <p className="mt-4 text-slate-600 leading-relaxed">{profile.summary}</p>

          {profile.skills?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {(profile.strengths?.length > 0 || profile.growthAreas?.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {profile.strengths?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-slate-800 mb-2 text-sm">Strengths</h3>
                <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
                  {profile.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {profile.growthAreas?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-slate-800 mb-2 text-sm">Areas to strengthen</h3>
                <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
                  {profile.growthAreas.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {profile.projects?.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-800 mb-3">Projects</h2>
            <div className="space-y-4">
              {profile.projects.map((p, i) => (
                <div key={i} className="card p-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-medium text-slate-900">{p.title}</h3>
                    <div className="flex gap-2">
                      {p.links?.map((l, li) => (
                        <a
                          key={li}
                          href={l.startsWith("http") ? l : `https://${l}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100"
                        >
                          {l.replace(/^https?:\/\//, "").split("/")[0]}
                        </a>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{p.description}</p>
                  {p.aiExplanation && p.aiExplanation !== p.description && (
                    <p className="text-sm text-slate-400 mt-2 italic">"{p.aiExplanation}"</p>
                  )}
                  {p.images?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.images.map((url, ii) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={ii}
                          src={url}
                          alt={`${p.title} screenshot`}
                          className="w-28 h-20 object-cover rounded-lg border border-slate-200"
                        />
                      ))}
                    </div>
                  )}
                  {p.documents?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.documents.map((doc, di) => (
                        <a
                          key={di}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          📄 {doc.name}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tech?.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {t}
                      </span>
                    ))}
                  </div>
                  {p.impact && <p className="text-xs text-slate-400 mt-2">Impact: {p.impact}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.experience?.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-800 mb-3">Experience</h2>
            <div className="space-y-4">
              {profile.experience.map((e, i) => (
                <div key={i} className="card p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-900">
                      {e.role} · {e.company}
                    </h3>
                    <span className="text-xs text-slate-400">{e.period}</span>
                  </div>
                  <ul className="text-sm text-slate-600 mt-2 space-y-1 list-disc list-inside">
                    {e.bullets?.map((b, bi) => (
                      <li key={bi}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <AskBox candidateId={candidate.id} />
      </section>
    </main>
  );
}
