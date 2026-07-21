# Onboarding — The Ear Academy Sales System

Hey Rus — this is the codebase for the sales dashboard you and Badikazi are using at
https://ear-academy-sales.vercel.app. This doc is a fast orientation so you can pick up
development with Claude Code. For full technical detail, read `README.md` in the repo root
first — this doc just points you at the right places.

## What this is

A two-motion sales dashboard (your priority list + Badikazi's outreach queue), backed by
Supabase, with two live automations: ActiveCampaign deal-stage sync and Outlook reply
detection. Full explanation of the product in plain terms: see the pitch/spec docs shared
with you separately, or `README.md`'s intro section.

## Where things live

- **Code:** this repo, branch `claude/dashboard-creation-n0jl7m` (not yet merged to `main`)
- **Live app:** https://ear-academy-sales.vercel.app (Vercel project `ear-academy-sales`,
  team `the-ear-academy`)
- **Database:** Supabase project `oowfsxjngaxzxdsdnpxr`
- **Edge functions:** `supabase/functions/` — `notify-handover`, `ac-deal-webhook`,
  `outlook-reply-scan`
- **Schema:** `supabase_schema.sql` plus `supabase_schema_patch.sql` through `_7.sql`, applied
  in that order — each patch file explains what it adds and why

## Getting set up

1. Clone the repo, check out `claude/dashboard-creation-n0jl7m`
2. Try demo mode first — no credentials needed:
   ```bash
   cp .env.example .env   # set VITE_DEMO_MODE=true
   npm install && npm run dev
   ```
   Log in as `rus@the-ear.com` / `coordinator@the-ear.com`, password `demo`.
3. For the live database, you'll need the Supabase project URL + anon key (ask Brandon or
   pull them from the Vercel project's environment variables) — set `VITE_DEMO_MODE=false`
   in `.env` instead.
4. Full setup steps (schema, edge functions, secrets, Vercel env vars) are in `README.md`
   under **Setup**.

## Current state — what's done, what's next

Everything currently live is listed in `README.md` under **Status**. Short version:
core dashboard, dark mode, AC sync, and Outlook reply detection are all live and tested.
Two things are still open:

- **Lead migration** — the historical 357 leads from `unified_leads.json` haven't been
  imported yet. Once you have that file, `README.md`'s **Data migration** section explains
  the mapping rule (tier/status → Motion A vs Motion B, owner).
- **Resend email delivery** — parked on purpose (no API key set yet). Everything else about
  the handover flow works without it.

## Credentials you'll need going forward

You'll want your own Supabase personal access token and Vercel token rather than reusing
anything from this session — ask Brandon for GitHub collaborator access on this repo, and
set yourself up with your own tokens for Supabase and Vercel management API access.

## Questions

Ping Brandon if anything here doesn't match what you find in the repo — this doc reflects
the state of the project as of 16 July 2026.
