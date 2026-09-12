import Link from "next/link";

export default function SiteFooter() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <footer className="border-t border-slate-100 mt-10">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
        <span>© {new Date().getFullYear()} HireFlow AI</span>
        <Link href="/privacy" className="hover:text-slate-600">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-slate-600">
          Terms
        </Link>
        {contact && (
          <a href={`mailto:${contact}`} className="hover:text-slate-600">
            Contact
          </a>
        )}
      </div>
    </footer>
  );
}
