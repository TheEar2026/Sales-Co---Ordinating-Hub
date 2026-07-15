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
4. **Outlook reply detection** — code deployed and tested (auth gate,
   the case-insensitive matching function), but can't reach Outlook or
   run on a schedule yet — needs an Azure AD app registration with
   Graph `Mail.Read` **application** permission, which only your
   organisation can create (see Outlook reply detection below).

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

Twice daily (08:00 and 18:00 SAST), a scan checks Rus's and the
coordinator's Outlook inboxes for new mail and moves any lead that
replies from `t1-sent` / `t2-sent` / `t3-sent` to `reply-received` —
Badi never has to log a reply by hand. Deployed and tested (auth gate
confirmed, RPC lookup confirmed against a real edge case — see below),
**but not yet scheduled or able to reach Outlook**, both of which need
one thing only your organisation can provide:

**An Azure AD app registration with application (not delegated)
permissions.** A normal "sign in with Microsoft" connection is tied to
one person's session and can't read a *different* mailbox unattended —
this needs a registration with Microsoft Graph **Mail.Read**
(Application, not Delegated), admin-consented, with access to both
`rus@the-ear.com` and the coordinator's mailbox.

1. **Register the app** (Azure Portal → Entra ID → App registrations →
   New registration → API permissions → Microsoft Graph → Application
   permissions → `Mail.Read` → Grant admin consent). Create a client
   secret under Certificates & secrets.
2. **Set the remaining secrets:**
   ```bash
   supabase secrets set \
     MICROSOFT_TENANT_ID=<tenant id> \
     MICROSOFT_CLIENT_ID=<app client id> \
     MICROSOFT_CLIENT_SECRET=<client secret value>
   ```
   (`RUS_EMAIL`, `BADI_EMAIL`, and `CRON_SECRET` are already set.)
3. **Test manually** before scheduling anything:
   ```bash
   curl -X POST "https://<project-ref>.functions.supabase.co/outlook-reply-scan" \
     -H "Authorization: Bearer <CRON_SECRET value>"
   ```
   Check the `outlook_reply_log` table for what it found (or
   `app_config` for the `outlook_last_scan_at` watermark it set).
4. **Enable the twice-daily schedule** — deliberately not run by the
   schema patch, so a misconfigured integration doesn't generate
   scheduled failures. Once step 3 succeeds:
   ```sql
   select cron.schedule(
     'outlook-reply-scan-morning', '0 6 * * *',
     $$select net.http_post(
         url := 'https://<project-ref>.functions.supabase.co/outlook-reply-scan',
         headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET value>'),
         body := '{}'::jsonb
       );$$
   );
   select cron.schedule(
     'outlook-reply-scan-evening', '0 16 * * *',
     $$select net.http_post(
         url := 'https://<project-ref>.functions.supabase.co/outlook-reply-scan',
         headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET value>'),
         body := '{}'::jsonb
       );$$
   );
   ```
   (06:00 / 16:00 UTC = 08:00 / 18:00 SAST, UTC+2.)
5. **Matching:** case-insensitive on `contact_email`, via a
   `find_lead_by_email` SQL function rather than a client-side `ilike`
   filter — `ilike` treats `_` as a wildcard, and `_` is a legal email
   character, so an `ilike` match could silently match the *wrong*
   lead. Verified against that exact scenario during testing.
6. **What doesn't downgrade:** a lead already past `reply-received`
   that gets another reply isn't moved backward — it's recorded in
   `outlook_reply_log` as a `further_reply` with no status change.
7. **What isn't logged:** unlike the AC sync, non-matching inbox mail
   is skipped with no log entry at all, per spec — an inbox sees far
   more unrelated mail than a deal webhook ever would, and logging
   every miss would drown the table.

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
