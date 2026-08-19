-- Migration 003 — opt-in two-way matching
-- Safe to run more than once. Run in: Supabase Dashboard > SQL Editor > Run

-- Candidates must explicitly opt in before other recruiters can discover them.
alter table candidates add column if not exists open_to_matching boolean not null default false;

create index if not exists idx_candidates_open_to_matching
  on candidates(open_to_matching) where open_to_matching;

create index if not exists idx_jobs_open on jobs(status) where status = 'open';
