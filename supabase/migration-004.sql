-- Migration 004 — launch readiness: retention tracking + where each profile came from
-- Safe to run more than once. Run in: Supabase Dashboard > SQL Editor > Run

-- Last authenticated activity, so the stats page can tell whether recruiters come back.
alter table users add column if not exists last_seen_at timestamptz;

-- self = candidate built it themselves, link = submitted via a recruiter's intake link,
-- bulk = résumé uploaded by a recruiter. Decides what account deletion removes.
alter table candidates add column if not exists source text;

do $$
begin
  alter table candidates
    add constraint candidates_source_check check (source in ('self', 'link', 'bulk'));
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_candidates_recruiter_source on candidates(recruiter_id, source);
