import NavBar from "@/components/NavBar";

export const LEGAL_LAST_UPDATED = "13 September 2026";

export function LegalShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <main>
      <NavBar />
      <article className="max-w-3xl mx-auto px-6 pb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated {LEGAL_LAST_UPDATED}</p>
        <p className="mt-6 text-sm text-slate-600 leading-relaxed">{intro}</p>
        {children}
      </article>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-2 space-y-3 text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function ContactLink() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return contact ? (
    <a href={`mailto:${contact}`} className="text-brand-600 hover:underline">
      {contact}
    </a>
  ) : (
    <span>the operator of this site</span>
  );
}
