import Link from "next/link";

export default function NavBar({ right }: { right?: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-semibold text-slate-800">
        <span className="w-7 h-7 rounded-lg bg-brand-500 text-white grid place-items-center text-sm">H</span>
        HireFlow AI
      </Link>
      {right}
    </div>
  );
}
