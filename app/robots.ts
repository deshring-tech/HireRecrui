import type { MetadataRoute } from "next";

// Profile pages (/r/...) are deliberately NOT disallowed here: link-preview bots
// (LinkedIn, WhatsApp, Slack) honour robots.txt, and blocking them would break the
// preview cards candidates rely on when sharing. Those pages opt out of search
// indexing with a noindex meta tag instead.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/candidate/edit/", "/recruiter", "/reset"],
    },
  };
}
