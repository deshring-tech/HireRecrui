# HireFlow AI — Setup

## Run locally (zero config)

```
npm install
npm run dev
```

Or double-click `start.bat`. With no env vars set, the app uses a local JSON file
(`data/db.json`) and a local uploads folder — everything works out of the box.

## Switch to Supabase (database + file storage)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. Open **SQL Editor** in the Supabase dashboard, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all
   tables, indexes, RLS locks, and the `uploads` storage bucket.
3. Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_URL` — Project Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → `service_role` key
     (server-only secret; never expose it to the browser)
4. Restart the dev server. The app now reads/writes Supabase automatically —
   no code changes.

**Upgrading an existing Supabase project?** `schema.sql` is for fresh projects. If
your tables already exist, run the numbered migrations you haven't run yet, in
order, in the SQL Editor: `supabase/migration-002.sql`, `migration-003.sql`,
`migration-004.sql`. They are additive and safe to re-run. Always run them
**before** deploying code that needs them.

Note: data does NOT migrate automatically from `data/db.json`; start fresh or
ask for a migration script if you have data worth keeping.

## Deploy to Vercel

1. Push the repo to GitHub and import it in Vercel (framework preset: Next.js).
2. Add the same env vars from `.env.local` in Vercel → Project → Settings →
   Environment Variables.
3. Supabase env vars are REQUIRED on Vercel — its filesystem is ephemeral, so
   the JSON/local-disk fallback will not persist there.

## Optional services

| Env var | What it unlocks | Without it |
|---|---|---|
| `OPENAI_API_KEY` | LLM-generated profiles, questions, scoring, Q&A | Built-in algorithmic engine |
| `RESEND_API_KEY` | Real email delivery (notifications, password reset) | Emails logged to server console |
| `ADMIN_EMAILS` | Comma-separated logins allowed to open `/admin` (launch stats) | `/admin` returns 404 for everyone |
| `LAUNCH_GOAL_RETAINED_RECRUITERS` | Target shown on the stats page (default 10) | Uses 10 |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact address on Privacy / Terms pages | Pages show a generic "contact us" note |
