import Link from "next/link";
import NavBar from "@/components/NavBar";

export default function Home() {
  return (
    <main>
      <NavBar />
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-14 text-center">
        <span className="inline-block mb-5 text-xs font-medium px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
          The interactive hiring layer
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
          One link. An interactive resume.
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
          Candidates paste their work once. AI fills the gaps and builds a shareable,
          ATS-friendly profile. Recruiters screen it in a couple of clicks.
        </p>

        <div className="mt-12 grid sm:grid-cols-2 gap-5 text-left">
          <Link href="/login" className="card p-7 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 grid place-items-center mb-4 text-lg">
              🔍
            </div>
            <h2 className="text-lg font-semibold text-slate-900">I'm a Recruiter</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Create roles, get a shareable intake link, and screen every candidate's real work in 2-4 clicks.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-brand-600">Log in or sign up →</span>
          </Link>

          <Link href="/candidate" className="card p-7 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 grid place-items-center mb-4 text-lg">
              🧑‍💻
            </div>
            <h2 className="text-lg font-semibold text-slate-900">I'm a Candidate</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Paste your work once, get an interactive profile and one shareable link to send to recruiters — no
              account needed.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-brand-600">Build my profile →</span>
          </Link>
        </div>

        <div className="mt-16 grid sm:grid-cols-3 gap-6 text-left">
          <Feature icon="📄" title="Real work, not PDFs">
            Skills, projects, and links become an interactive profile — not another resume to skim.
          </Feature>
          <Feature icon="🎯" title="Auto-matched & ranked">
            Upload a stack of resumes; each is scored against your open roles and routed to the best fit.
          </Feature>
          <Feature icon="🤝" title="You decide, always">
            AI ranks and flags — every accept, interview, and reject stays a human call.
          </Feature>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xl mb-2">{icon}</div>
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{children}</p>
    </div>
  );
}
