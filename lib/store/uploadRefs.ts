import type { ProjectInput } from "./types";

// Every uploaded file (screenshots, project documents) a candidate's projects point at.
export function uploadUrlsFromProjects(projects: ProjectInput[] | null | undefined): string[] {
  const urls = new Set<string>();
  for (const p of projects || []) {
    for (const u of p.images || []) if (u) urls.add(u);
    for (const d of p.documents || []) if (d?.url) urls.add(d.url);
  }
  return [...urls];
}
