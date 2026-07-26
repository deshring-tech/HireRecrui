import type { Metadata } from "next";
import "./globals.css";

// "H" mark on the brand color, inlined so there's no external favicon request.
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%235b5bf0'/%3E%3Ctext x='50' y='73' font-size='62' font-family='Arial,sans-serif' font-weight='bold' fill='white' text-anchor='middle'%3EH%3C/text%3E%3C/svg%3E";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://hire-recrui.vercel.app"),
  title: {
    default: "HireFlow AI — interactive resumes, 2-click screening",
    template: "%s · HireFlow AI",
  },
  description:
    "Candidates turn their work into one shareable interactive profile. Recruiters auto-match, rank, and screen resumes in a couple of clicks.",
  icons: { icon: FAVICON },
  openGraph: {
    type: "website",
    siteName: "HireFlow AI",
    title: "HireFlow AI — interactive resumes, 2-click screening",
    description:
      "One shareable interactive profile for candidates. Auto-match, rank, and screen resumes for recruiters.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HireFlow AI",
    description: "Interactive resumes for candidates. 2-click screening for recruiters.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased font-sans">{children}</body>
    </html>
  );
}
