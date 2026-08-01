import type { Metadata } from "next";
import { getCandidate, getJob } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import AskBox from "@/components/AskBox";
import DecisionButtons from "@/components/DecisionButtons";
import EmailCandidateButton from "@/components/EmailCandidateButton";
import CopyLinkButton from "@/components/CopyLinkButton";
import ProfileViewTracker from "@/components/ProfileViewTracker";
import { notFound } from "next/navigation";

// Per-profile preview so shared links render a proper card on LinkedIn/WhatsApp/etc.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const candidate = await getCandidate(params.id);
  if (!candidate) return { title: "Profile not found" };
  const { name, title, summary, skills } = candidate.profile;
  const description =
    (summary && summary.slice(0, 180)) ||
    `${title}${skills?.length ? ` — ${skills.slice(0, 5).join(", ")}` : ""}`;
  const heading = `${name} — ${title}`;
  return {
    title: heading,
    description,
    openGraph: { type: "profile", title: heading, description },
    twitter: { card: "summary", title: heading, description },
  };
}

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

  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const verifiedCount = (profile.projects || []).reduce(
    (n, p) => n + (p.verifiedLinks?.length || 0),
    0
  );

  return (
    <main>
      <NavBar right={<CopyLinkButton />} />
      <section className="max-w-3xl mx-auto px-6 pb-24 space-y-6">
        <div className="card overflow-hidden">
          <div className="h-16 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700" />
          <div className="px-7 pb-7">
            <div className="flex items-end gap-4 flex-wrap -mt-8">
              <div className="avatar w-16 h-16 text-xl ring-4 ring-white">{initials || "🙂"}</div>
              <div className="flex-1 min-w-[200px] flex items-end justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 leading-tight">{profile.name}</h1>
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
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {jobTitle && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                  Applying for {jobTitle}
                </span>
              )}
              {verifiedCount > 0 && (
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                  title="These project links were checked and load successfully"
                >
                  ✓ {verifiedCount} verified {verifiedCount === 1 ? "link" : "links"}
                </span>
              )}
            </div>

            <p className="mt-4 text-slate-600 leading-relaxed">{profile.summary}</p>

            {profile.skills?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span key={s} className="skill-chip">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
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
            <h2 className="section-title">Projects</h2>
            <div className="space-y-4">
              {profile.projects.map((p, i) => (
                <div key={i} className="card p-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-medium text-slate-900">{p.title}</h3>
                    <div className="flex gap-2 flex-wrap">
                      {p.links?.map((l, li) => {
                        const verified = p.verifiedLinks?.includes(l);
                        return (
                          <a
                            key={li}
                            href={l.startsWith("http") ? l : `https://${l}`}
                            target="_blank"
                            rel="noreferrer"
                            title={verified ? "Link verified — this loads successfully" : undefined}
                            className={`text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                              verified
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                            }`}
                          >
                            {verified && <span aria-hidden>✓</span>}
                            {l.replace(/^https?:\/\//, "").split("/")[0]}
                          </a>
                        );
                      })}
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
            <h2 className="section-title">Experience</h2>
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
      <ProfileViewTracker candidateId={candidate.id} />
    </main>
  );
}
