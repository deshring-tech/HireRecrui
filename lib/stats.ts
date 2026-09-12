import type { AdminRows } from "@/lib/store/types";

const DAY = 86_400_000;

export type LaunchStats = {
  generatedAt: string;
  goal: { target: number; retainedRecruiters: number };
  recruiters: {
    total: number;
    newLast7d: number;
    activeLast7d: number;
    // Signed up more than a week ago, so they've had the chance to come back.
    eligibleForRetention: number;
    // Of those, active again this week — at least a day after signing up.
    retainedWeek2: number;
  };
  candidates: {
    total: number;
    newLast7d: number;
    bySource: { self: number; link: number; bulk: number; unknown: number };
    viewed: number;
    openToMatching: number;
    decided: number;
  };
  jobs: { total: number; open: number };
  daily: { date: string; recruiters: number; candidates: number }[];
};

function time(iso: string | null | undefined): number {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? -Infinity : t;
}

// Pure so it can be reasoned about (and tested) independently of the database.
export function computeStats(rows: AdminRows, now: number = Date.now(), target = 10): LaunchStats {
  const weekAgo = now - 7 * DAY;

  const lastSession = new Map<string, number>();
  for (const s of rows.sessions) {
    const t = time(s.createdAt);
    if (t > (lastSession.get(s.userId) ?? -Infinity)) lastSession.set(s.userId, t);
  }

  const recruiters = { total: rows.users.length, newLast7d: 0, activeLast7d: 0, eligibleForRetention: 0, retainedWeek2: 0 };
  for (const u of rows.users) {
    const created = time(u.createdAt);
    const lastActive = Math.max(created, time(u.lastSeenAt), lastSession.get(u.id) ?? -Infinity);
    if (created >= weekAgo) recruiters.newLast7d++;
    if (lastActive >= weekAgo) recruiters.activeLast7d++;
    if (created < weekAgo) {
      recruiters.eligibleForRetention++;
      if (lastActive >= weekAgo && lastActive - created >= DAY) recruiters.retainedWeek2++;
    }
  }

  const candidates = {
    total: rows.candidates.length,
    newLast7d: 0,
    bySource: { self: 0, link: 0, bulk: 0, unknown: 0 },
    viewed: 0,
    openToMatching: 0,
    decided: 0,
  };
  for (const c of rows.candidates) {
    if (time(c.createdAt) >= weekAgo) candidates.newLast7d++;
    if (c.source === "self" || c.source === "link" || c.source === "bulk") candidates.bySource[c.source]++;
    else candidates.bySource.unknown++;
    if (c.viewCount > 0) candidates.viewed++;
    if (c.openToMatching) candidates.openToMatching++;
    if (c.status !== "new") candidates.decided++;
  }

  const daily: LaunchStats["daily"] = [];
  const dayIndex = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now - i * DAY).toISOString().slice(0, 10);
    dayIndex.set(date, daily.length);
    daily.push({ date, recruiters: 0, candidates: 0 });
  }
  for (const u of rows.users) {
    const i = dayIndex.get((u.createdAt || "").slice(0, 10));
    if (i !== undefined) daily[i].recruiters++;
  }
  for (const c of rows.candidates) {
    const i = dayIndex.get((c.createdAt || "").slice(0, 10));
    if (i !== undefined) daily[i].candidates++;
  }

  return {
    generatedAt: new Date(now).toISOString(),
    goal: { target, retainedRecruiters: recruiters.retainedWeek2 },
    recruiters,
    candidates,
    jobs: { total: rows.jobs.length, open: rows.jobs.filter((j) => j.status === "open").length },
    daily,
  };
}
