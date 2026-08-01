"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { DocumentRef, ProjectInput } from "@/lib/db";

type ProjectDraft = {
  title: string;
  description: string;
  linksRaw: string;
  images: string[];
  documents: DocumentRef[];
  docsText: string;
  uploadingImage: boolean;
  uploadingDoc: boolean;
};

const STYLES = [
  { value: "ats", label: "ATS-Optimized", hint: "Plain, keyword-forward, parses cleanly" },
  { value: "modern", label: "Modern", hint: "Balanced tone, human-friendly" },
  { value: "technical", label: "Technical", hint: "Depth-first, stack & architecture focus" },
] as const;

const emptyProject = (): ProjectDraft => ({
  title: "",
  description: "",
  linksRaw: "",
  images: [],
  documents: [],
  docsText: "",
  uploadingImage: false,
  uploadingDoc: false,
});

function toDraft(p: ProjectInput): ProjectDraft {
  return {
    title: p.title,
    description: p.description,
    linksRaw: (p.links || []).join(", "),
    images: p.images || [],
    documents: p.documents || [],
    docsText: "",
    uploadingImage: false,
    uploadingDoc: false,
  };
}

export type WizardInitial = {
  name: string;
  title: string;
  email: string;
  rawResume: string;
  projects: ProjectInput[];
  style: "ats" | "modern" | "technical";
};

export default function CandidateWizard({
  mode,
  recruiterId,
  jobId,
  editToken,
  recruiterName,
  jobTitle,
  salaryRange,
  initial,
}: {
  mode: "create" | "edit";
  recruiterId?: string;
  jobId?: string;
  editToken?: string;
  recruiterName?: string;
  jobTitle?: string;
  salaryRange?: string;
  initial?: WizardInitial;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [consent, setConsent] = useState(mode === "edit");
  const [done, setDone] = useState<{ id: string; editToken: string } | null>(null);

  const [name, setName] = useState(initial?.name || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [rawResume, setRawResume] = useState(initial?.rawResume || "");
  const [style, setStyle] = useState<(typeof STYLES)[number]["value"]>(initial?.style || "ats");
  const [projects, setProjects] = useState<ProjectDraft[]>(
    initial?.projects?.length ? initial.projects.map(toDraft) : [emptyProject()]
  );

  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);

  const resumeInputRef = useRef<HTMLInputElement>(null);

  function updateProject(i: number, patch: Partial<ProjectDraft>) {
    setProjects((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function addProject() {
    setProjects((prev) => [...prev, emptyProject()]);
  }
  function removeProject(i: number) {
    setProjects((prev) => prev.filter((_, idx) => idx !== i));
  }

  const cleanProjects = () =>
    projects
      .filter((p) => p.title.trim())
      .map((p) => ({
        title: p.title.trim(),
        description: p.description.trim(),
        links: p.linksRaw.split(",").map((l) => l.trim()).filter(Boolean),
        images: p.images,
        documents: p.documents,
        docsText: p.docsText,
      }));

  async function handleResumeFile(file: File) {
    setResumeUploading(true);
    setResumeError("");
    try {
      const fd = new FormData();
      fd.append("kind", "resume");
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setResumeError(data.error || "Could not read that file.");
        return;
      }
      setRawResume(data.text);
      setResumeFileName(file.name);
    } catch {
      setResumeError("Upload failed. Try pasting the text instead.");
    } finally {
      setResumeUploading(false);
    }
  }

  async function handleProjectImage(i: number, file: File) {
    updateProject(i, { uploadingImage: true });
    try {
      const fd = new FormData();
      fd.append("kind", "project-image");
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, images: [...p.images, data.url] } : p))
        );
      }
    } finally {
      updateProject(i, { uploadingImage: false });
    }
  }
  function removeProjectImage(i: number, url: string) {
    setProjects((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, images: p.images.filter((u) => u !== url) } : p))
    );
  }

  async function handleProjectDoc(i: number, file: File) {
    updateProject(i, { uploadingDoc: true });
    try {
      const fd = new FormData();
      fd.append("kind", "project-doc");
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? {
                  ...p,
                  documents: [...p.documents, { url: data.url, name: data.name }],
                  docsText: [p.docsText, data.text].filter(Boolean).join("\n\n"),
                }
              : p
          )
        );
      }
    } finally {
      updateProject(i, { uploadingDoc: false });
    }
  }
  function removeProjectDoc(i: number, url: string) {
    setProjects((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, documents: p.documents.filter((d) => d.url !== url) } : p))
    );
  }

  async function handleContinue() {
    if (!name.trim() || !title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title, rawResume, projects: cleanProjects() }),
      });
      const data = await res.json();
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(""));
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          title,
          email,
          rawResume,
          projects: cleanProjects(),
          clarifyingQA: questions.map((q, i) => ({ question: q, answer: answers[i] || "" })),
          style,
          recruiterId,
          jobId,
          editToken,
          consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong building your profile.");
        return;
      }
      setDone({ id: data.id, editToken: data.editToken });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">✨</div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {mode === "edit" ? "Profile updated" : "Your profile is live"}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {mode === "edit" ? "Your changes are saved." : "Share the public link — the recruiter has been notified."}
          </p>
        </div>

        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Public profile link (share this)</label>
            <div className="flex items-center gap-2">
              <input className="input" readOnly value={`${origin}/r/${done.id}`} />
              <CopyBtn text={`${origin}/r/${done.id}`} />
            </div>
          </div>
          <div>
            <label className="label">Private edit link (save this to update later)</label>
            <div className="flex items-center gap-2">
              <input className="input" readOnly value={`${origin}/candidate/edit/${done.editToken}`} />
              <CopyBtn text={`${origin}/candidate/edit/${done.editToken}`} />
            </div>
            <p className="text-xs text-slate-400 mt-1">Keep this private — anyone with it can edit your profile.</p>
          </div>
        </div>

        <Link href={`/r/${done.id}`} className="btn-primary inline-flex">
          View my profile →
        </Link>
      </div>
    );
  }

  return (
    <>
      {mode === "create" && recruiterName && (
        <div className="mb-6 text-sm bg-brand-50 text-brand-700 border border-brand-100 rounded-xl px-4 py-3">
          {jobTitle ? (
            <>
              Applying to <strong>{jobTitle}</strong> — your profile goes to {recruiterName}.
            </>
          ) : (
            <>Your profile will be sent to {recruiterName}.</>
          )}
          {salaryRange && (
            <div className="mt-1.5 font-medium">💰 {salaryRange}</div>
          )}
        </div>
      )}

      {mode === "create" && !recruiterName && (
        <div className="mb-6 text-sm bg-brand-50 text-brand-700 border border-brand-100 rounded-xl px-4 py-3">
          Build your interactive profile once and get a shareable link to send to any recruiter or add to your
          applications — no account needed.
        </div>
      )}

      <div className="flex items-center gap-2 mb-8">
        <StepDot active={step >= 1} />
        <div className="h-px w-8 bg-slate-200" />
        <StepDot active={step >= 2} />
        <span className="ml-3 text-sm text-slate-400">Step {step} of 2</span>
      </div>

      {step === 1 && (
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {mode === "edit" ? "Update your profile" : "Tell us about you"}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Upload or paste what you already have. AI will ask a few follow-ups next.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label">Title / role</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Backend Engineer" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Your resume</label>
              <div className="flex items-center gap-2">
                {resumeFileName && <span className="text-xs text-slate-400">{resumeFileName}</span>}
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={resumeUploading}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  {resumeUploading ? "Reading file..." : "⬆ Upload PDF / DOCX / TXT"}
                </button>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleResumeFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
            {resumeError && <p className="text-xs text-rose-500 mb-2">{resumeError}</p>}
            <textarea
              className="input min-h-[140px] resize-y"
              value={rawResume}
              onChange={(e) => setRawResume(e.target.value)}
              placeholder="...or paste the raw text of your resume here"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Projects</label>
              <button onClick={addProject} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                + Add project
              </button>
            </div>
            <div className="space-y-4">
              {projects.map((p, i) => (
                <div key={i} className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      className="input"
                      placeholder="Project name (e.g. GymExec)"
                      value={p.title}
                      onChange={(e) => updateProject(i, { title: e.target.value })}
                    />
                    {projects.length > 1 && (
                      <button
                        onClick={() => removeProject(i)}
                        className="ml-2 text-slate-400 hover:text-rose-500 text-sm"
                        aria-label="Remove project"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <textarea
                    className="input min-h-[70px] resize-y"
                    placeholder="What did you build? What did it do?"
                    value={p.description}
                    onChange={(e) => updateProject(i, { description: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Links, comma separated (GitHub, live demo, docs...)"
                    value={p.linksRaw}
                    onChange={(e) => updateProject(i, { linksRaw: e.target.value })}
                  />

                  <div className="flex items-center gap-2 flex-wrap">
                    {p.images.map((url) => (
                      <div key={url} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
                        <button
                          onClick={() => removeProjectImage(i, url)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] leading-4"
                          aria-label="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <label className="w-14 h-14 rounded-lg border border-dashed border-slate-300 grid place-items-center text-slate-400 text-xs cursor-pointer hover:border-brand-400 hover:text-brand-500">
                      {p.uploadingImage ? "..." : "+ img"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleProjectImage(i, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {p.documents.map((doc) => (
                      <span
                        key={doc.url}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600"
                      >
                        📄 {doc.name.length > 20 ? doc.name.slice(0, 17) + "..." : doc.name}
                        <button
                          onClick={() => removeProjectDoc(i, doc.url)}
                          className="text-slate-400 hover:text-rose-500"
                          aria-label="Remove document"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <label className="text-xs px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-400 cursor-pointer hover:border-brand-400 hover:text-brand-500">
                      {p.uploadingDoc ? "Reading..." : "+ doc (PDF/DOCX)"}
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleProjectDoc(i, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Resume style</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`card p-3 text-left transition ${
                    style === s.value ? "border-brand-500 ring-2 ring-brand-100" : "hover:border-slate-300"
                  }`}
                >
                  <div className="text-sm font-medium text-slate-800">{s.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={loading || !name.trim() || !title.trim()}
            className="btn-primary w-full sm:w-auto"
          >
            {loading ? "Thinking..." : "Continue →"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">A few quick questions</h1>
            <p className="text-slate-500 mt-1 text-sm">
              AI generated these from what you shared, to fill in the gaps recruiters usually ask about.
            </p>
          </div>

          <div className="space-y-5">
            {questions.map((q, i) => (
              <div key={i}>
                <label className="label">{q}</label>
                <textarea
                  className="input min-h-[70px] resize-y"
                  value={answers[i] || ""}
                  onChange={(e) => setAnswers((prev) => prev.map((a, idx) => (idx === i ? e.target.value : a)))}
                />
              </div>
            ))}
          </div>

          {mode === "create" && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="font-medium text-slate-700 mb-1">How AI is used here</p>
                <p>
                  AI structures what you provide into a readable profile and suggests a match score for recruiters.
                  It does <strong>not</strong> auto-reject anyone — every accept, interview, and reject decision is
                  made by a human. You can edit or update your profile at any time with your private link.
                </p>
              </div>
              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-100"
                />
                <span>
                  I consent to my resume and uploaded materials being processed by AI to generate an interactive,
                  shareable profile.{" "}
                  {recruiterName
                    ? "It will be shared with the recruiter above, and I understand a human makes the final hiring decision."
                    : "I control who I share the link with."}
                </span>
              </label>
            </div>
          )}

          {submitError && <p className="text-sm text-rose-500">{submitError}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">
              ← Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || (mode === "create" && !consent)}
              className="btn-primary"
            >
              {loading
                ? mode === "edit"
                  ? "Saving..."
                  : "Building your profile..."
                : mode === "edit"
                ? "Save changes ✨"
                : "Build my interactive resume ✨"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function StepDot({ active }: { active: boolean }) {
  return <div className={`w-2.5 h-2.5 rounded-full ${active ? "bg-brand-500" : "bg-slate-200"}`} />;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary text-sm shrink-0"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
