-- HireFlow AI — Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query).

create table if not exists users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists reset_tokens (
  token uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists jobs (
  id uuid primary key,
  recruiter_id uuid not null references users(id) on delete cascade,
  title text not null,
  requirement text not null default '',
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists candidates (
  id uuid primary key,
  recruiter_id uuid not null references users(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  edit_token uuid not null unique,
  name text not null,
  title text not null,
  email text not null default '',
  raw_resume text not null default '',
  projects jsonb not null default '[]',
  clarifying_qa jsonb not null default '[]',
  style text not null default 'ats' check (style in ('ats', 'modern', 'technical')),
  profile jsonb not null,
  score jsonb,
  status text not null default 'new' check (status in ('new', 'accepted', 'rejected', 'interview')),
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key,
  audience text not null,
  type text not null check (type in ('new_candidate', 'status_change')),
  message text not null,
  candidate_id uuid references candidates(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes for the queries the app actually runs
create index if not exists idx_candidates_recruiter on candidates(recruiter_id, created_at desc);
create index if not exists idx_candidates_job on candidates(job_id);
create index if not exists idx_jobs_recruiter on jobs(recruiter_id, created_at desc);
create index if not exists idx_sessions_user on sessions(user_id);
create index if not exists idx_notifications_audience on notifications(audience, created_at desc);

-- Row Level Security: the app talks to Postgres only through the service-role key
-- (server-side), which bypasses RLS. Enabling RLS with no policies means the anon
-- public key can read/write NOTHING — locking the tables from any client-side access.
alter table users enable row level security;
alter table sessions enable row level security;
alter table reset_tokens enable row level security;
alter table jobs enable row level security;
alter table candidates enable row level security;
alter table notifications enable row level security;

-- Storage bucket for resume docs / project images / project docs.
-- Public reads (profile pages embed these URLs); writes only via service role.
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;
