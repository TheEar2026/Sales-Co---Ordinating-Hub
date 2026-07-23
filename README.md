# The Ear Academy Sales System

The primary daily working tool for a two-person sales team: Rus Nerwich
(founder, role `rus`) and a Sales Coordinator (role `coordinator`). Two
motions, one pipeline:

- **Motion A** — Rus's prioritised list of active deals.
- **Motion B** — the coordinator's outreach queue (T1/T2/T3 touches).
- **Scorecard** — the numbers behind both.

Replies from Motion B are handed off to Rus with one click; the handover
fires a Supabase→Resend email automatically.

ActiveCampaign is the source of truth for deal stage — when a deal moves
in AC Pipeline 5 ("Sales Conversion"), a webhook updates the matching
lead in Supabase automatically (see AC deal sync below).

## Stack

React 18 + TypeScript + Vite, Tailwind CSS, Supabase (Postgres + Auth +
Realtime + Edge Functions), Resend for email, deployed on Vercel.

## Status

**Deployed and live: https://ear-academy-sales.vercel.app**

Verified against the production Supabase project (`oowfsxjngaxzxdsdnpxr`).
Done: schema + patch applied, both user accounts created, realtime
enabled, `notify-handover` edge function deployed, database webhook
trigger created, full workflow tested end-to-end against the live
database, deployed to Vercel (`the-ear-academy` team) with production
env vars set.

Remaining before day-to-day use:

1. **Migrate the 357 leads** from `unified_leads.json` — the live
   database currently has both user accounts but no leads yet (see Data
   migration below).
2. **Resend key** (parked for now) — handover emails won't send until
   `supabase secrets set RESEND_API_KEY=<key>` is run and the-ear.com is
   confirmed verified in Resend. Everything else about the handover
   works without it (lead reassignment, real-time sync).
3. **AC deal sync** — done. Deployed, webhook added in ActiveCampaign,
   and verified end-to-end against a real deal move (see ActiveCampaign
   deal sync below).
4. **Outlook reply detection** — done. Azure AD app registered, deployed,
   and verified end-to-end against real inbox mail (a genuine match
   moved a lead from `t1-sent` to `reply-received`; non-matching mail
   was correctly skipped with no log entry). Scheduled via `pg_cron` to
   run twice daily (see Outlook reply detection below).

## Demo mode (try it without Supabase)

To explore the full dashboard with realistic sample data and no backend:

```bash
cp .env.example .env   # then set VITE_DEMO_MODE=true
npm install
npm run dev
```

Log in as `rus@the-ear.com` or `coordinator@the-ear.com`, password `demo`.
Everything works in-memory — the Motion B queue, template merge, the
handover flow, real-time list updates, the scorecard, and the template
editor. Data resets on page refresh. Demo mode is off unless
`VITE_DEMO_MODE=true`, so production builds are unaffected.

## Setup

1. **Create the schema.** In the Supabase SQL Editor, run, in order:
   - `supabase_schema.sql` — full schema, RLS policies, views, seed
     templates and sponsorship slots.
   - `supabase_schema_patch.sql` — adds `leads.next_action`, used by the
     Motion A "Next action" box (a manual note, distinct from `notes`).
   - `supabase_schema_patch_2.sql` — adds the `webhook_log` audit table,
     `leads.needs_review` / `review_reason` / `ac_deal_currency`, and
     extends the `scorecard` view. Required for the AC deal sync below.
   - `supabase_schema_patch_3.sql` — adds `app_config`, `outlook_reply_log`,
     the `find_lead_by_email` lookup function, and enables `pg_cron` /
     `pg_net`. Required for Outlook reply detection below.
   - `supabase_schema_patch_4.sql` — fixes `motion_b_daily` to include
     `reply-received` leads awaiting handover (they used to be invisible
     everywhere once Outlook auto-detected a reply).
   - `supabase_schema_patch_5.sql` — fixes `motion_a_daily` to filter on
     `motion = 'A'` as well as `owner = 'rus'`, so a lead with a
     mismatched motion/owner pair can't land in the wrong queue.
   - `supabase_schema_patch_6.sql` and `supabase_schema_patch_7.sql` — fix
     `paying_schools` on the `scorecard` view to count distinct schools
     (case/whitespace-insensitive), not raw won-lead rows — one school
     with multiple won contacts was being counted multiple times.
   - `supabase_schema_patch_8.sql` — adds `leads.contact_phone`.
   - `supabase_schema_patch_9.sql` — adds `leads.is_isasa` /
     `priority_band` / `data_completeness`, and reorders the Motion B
     fresh-T1 queue by ISASA band/completeness (Band 5/RED excluded
     entirely). Requires the ISASA backfill (see below) to populate.
2. **Create the two users** in Supabase Auth → Users (Rus and the
   coordinator), then insert their rows into `public.users` with the
   matching `id`, `email`, `full_name`, and `role`.
3. **Configure the app:**
   ```bash
   cp .env.example .env
   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   npm install
   npm run dev
   ```
4. **Deploy the Edge Function** (sends the handover email via Resend):
   ```bash
   supabase functions deploy notify-handover
   supabase secrets set RESEND_API_KEY=<your-resend-api-key>
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```
   Then in Supabase Dashboard → Database → Webhooks, create a hook on
   `handover_events` INSERT → Edge Function `notify-handover`.
5. **Deploy to Vercel** and add the same two `VITE_*` env vars there.

## ActiveCampaign deal sync

Keeps Supabase in sync with deal stage changes in AC Pipeline 5 ("Sales
Conversion") — no manual dashboard update required. Confirmed against
the live AC account: pipeline (`group`) ID **5**, stages 43 (Demo/Pilot),
46 (Negotiation), 47 (Agreed), 48 (Won), 49 (Lost) — Won/Lost are stages
within this pipeline, not a separate status field.

1. **Deploy the function:**
   ```bash
   supabase functions deploy ac-deal-webhook
   supabase secrets set AC_WEBHOOK_SECRET=<a random string you generate>
   ```
2. **In ActiveCampaign:** Settings → Developer → Webhooks → Add webhook
   - Event: **Deal Updated**
   - URL: `https://<project-ref>.functions.supabase.co/ac-deal-webhook?secret=<same AC_WEBHOOK_SECRET value>`
   - AC's webhook UI has no custom-header option, so the secret travels
     as a query parameter — the function checks it before doing anything
     else and returns 401 if it doesn't match.
3. **How it decides what to update:** the function reads `deal.pipelineid`
   and `deal.stageid` (confirmed against a real webhook call — this
   account sends "Deal Updated" events as JSON with these field names,
   not the REST API's `group`/`stage` naming the spec assumed), ignores
   anything outside pipeline 5, and maps the stage to a lead
   `status`/`motion`/`owner`. It looks the lead up by `ac_deal_id`; if
   none matches, it **creates** a new lead from whatever contact/deal
   fields the webhook included and sets `needs_review = true` so it
   surfaces as an amber flag on the card, in the detail panel, and as a
   count on the Scorecard until someone confirms it.
4. **Currency:** the Sales Conversion pipeline holds deals in more than
   one currency (ZAR, GBP, USD observed) — `ac_deal_value` is converted
   from AC's cents to whole units, and `ac_deal_currency` records which
   currency it actually is rather than assuming ZAR.
5. **Audit trail:** every webhook call — matched, ignored, or errored —
   is logged to `webhook_log` (deal id, pipeline, stage, resulting
   status, and the raw payload) so the sync can be debugged from the
   data alone.

## Outlook reply detection

Twice daily (06:00 and 18:00 SAST, via `pg_cron`), a scan checks Rus's
and the coordinator's Outlook inboxes for new mail and moves any lead
that replies from `t1-sent` / `t2-sent` / `t3-sent` to `reply-received`
— Badi never has to log a reply by hand. **Live and scheduled.**

Uses an Azure AD app registration with Microsoft Graph **Mail.Read**
(Application, not Delegated) permission, admin-consented — a normal
"sign in with Microsoft" connection is tied to one person's session and
can't read a *different* mailbox unattended, so this needs app-only
credentials with access to both `rus@the-ear.com` and the coordinator's
mailbox instead.

1. **The app registration** already exists (Azure Portal → Entra ID →
   App registrations → "Ear Academy Sales Sync"), with Microsoft Graph
   Application permission `Mail.Read` granted admin consent, and a
   client secret. If the secret ever needs rotating: Certificates &
   secrets → New client secret → copy the **Value** (not the Secret
   ID — Azure only shows the Value once) → re-run step 2 below.
2. **Secrets set:**
   ```bash
   supabase secrets set \
     MICROSOFT_TENANT_ID=<tenant id> \
     MICROSOFT_CLIENT_ID=<app client id> \
     MICROSOFT_CLIENT_SECRET=<client secret value>
   ```
   (`RUS_EMAIL`, `BADI_EMAIL`, and `CRON_SECRET` are also set.)
3. **Manual test call**, if you ever need to trigger a scan outside the
   schedule:
   ```bash
   curl -X POST "https://<project-ref>.functions.supabase.co/outlook-reply-scan" \
     -H "Authorization: Bearer <CRON_SECRET value>"
   ```
   Check the `outlook_reply_log` table for what it found (or
   `app_config` for the `outlook_last_scan_at` watermark it set).
4. **The twice-daily schedule** is registered via `pg_cron`
   (`outlook-reply-scan-morning` at `0 4 * * *`,
   `outlook-reply-scan-evening` at `0 16 * * *` — 04:00/16:00 UTC =
   06:00/18:00 SAST), each firing `net.http_post` at the function with
   the `CRON_SECRET` bearer token. Check `select * from cron.job;` and
   `select * from cron.job_run_details order by start_time desc;` to
   confirm runs are firing and succeeding.
5. **Matching:** case-insensitive on `contact_email`, via a
   `find_lead_by_email` SQL function rather than a client-side `ilike`
   filter — `ilike` treats `_` as a wildcard, and `_` is a legal email
   character, so an `ilike` match could silently match the *wrong*
   lead. The function is declared `returns setof leads`, not a bare
   `returns leads` composite — a bare-composite SQL function whose
   query matches zero rows still returns one row of all-NULL fields
   over PostgREST (a real bug caught during live testing: every
   non-matching inbox email was logged as a false "further_reply"
   because that all-NULL object is truthy in JS). `setof` makes a
   non-match a genuine empty array instead.
6. **What doesn't downgrade:** a lead already past `reply-received`
   that gets another reply isn't moved backward — it's recorded in
   `outlook_reply_log` as a `further_reply` with no status change.
7. **What isn't logged:** unlike the AC sync, non-matching inbox mail
   is skipped with no log entry at all, per spec — an inbox sees far
   more unrelated mail than a deal webhook ever would, and logging
   every miss would drown the table. Verified live: a real match
   (`brandon@the-ear.com`) logged exactly one `status_updated` row,
   while ~15 other genuine inbox emails in the same window (PayPal,
   GitHub, internal the-ear.com mail, etc.) produced zero log rows.

## Project layout

```
src/
  components/   layout, motionA, motionB, scorecard, templates, shared
  hooks/        useAuth, useLeads, useTemplates, useScorecard
  lib/          supabase client, handover RPC call, template merge
  pages/        Login, Dashboard
  types/        TypeScript types matching the Supabase schema
supabase/functions/notify-handover/     Resend email edge function
supabase/functions/ac-deal-webhook/     AC → Supabase deal-stage sync
supabase/functions/outlook-reply-scan/  Outlook → Supabase reply detection (scheduled)
supabase_schema.sql                    full DB schema
supabase_schema_patch.sql               additive patch (leads.next_action, realtime)
supabase_schema_patch_2.sql             additive patch (webhook_log, needs_review, AC deal sync)
supabase_schema_patch_3.sql             additive patch (app_config, outlook_reply_log, pg_cron)
supabase_schema_patch_4.sql             corrective patch (motion_b_daily shows reply-received)
supabase_schema_patch_5.sql             corrective patch (motion_a_daily filters on motion + owner)
supabase_schema_patch_6.sql             corrective patch (paying_schools counts distinct schools)
supabase_schema_patch_7.sql             corrective patch (paying_schools case/whitespace-insensitive)
supabase_schema_patch_8.sql             additive patch (leads.contact_phone)
supabase_schema_patch_9.sql             additive + corrective patch (ISASA priority columns, motion_b_daily reorder, scorecard isasa metrics)
```

## End-to-end test (once live)

1. Log in as coordinator, find a Motion B lead, mark T1 as sent.
2. Click "Flag for Rus — reply received", add a demo date and note, confirm.
3. Lead disappears from the coordinator's Motion B queue.
4. Log in as Rus — lead appears in Motion A with status "reply received".
5. Confirm the email notification arrives at rus@the-ear.com.

## Data migration

Once the above test passes, the existing 357 leads in `unified_leads.json`
can be mapped into the `leads` table and imported via Supabase's CSV
import. Do this only after the live test succeeds — work with sample data
first.
