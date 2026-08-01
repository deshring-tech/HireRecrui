-- Migration 002 — salary ranges + profile-view transparency
-- Safe to run more than once (all statements are additive / idempotent).
-- Run in: Supabase Dashboard > SQL Editor > New query > Run

alter table jobs add column if not exists salary_range text not null default '';

alter table candidates add column if not exists viewed_at timestamptz;
alter table candidates add column if not exists view_count integer not null default 0;
