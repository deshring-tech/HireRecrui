import type { Metadata } from "next";

// The URL of this page is a secret: anyone holding it can edit or delete the
// profile. Keep it out of search results and out of Referer headers.
export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function EditProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
