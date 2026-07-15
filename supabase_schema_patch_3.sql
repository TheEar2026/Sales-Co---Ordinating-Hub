-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 3
-- Run this after supabase_schema.sql, supabase_schema_patch.sql, and
-- supabase_schema_patch_2.sql. Additive only — does not touch existing
-- data.
--
-- Supports the Outlook → Supabase reply-detection scan
-- (supabase/functions/outlook-reply-scan).
-- ============================================================

-- 1. Generic key/value config store. First user: outlook_last_scan_at,
--    the watermark the scan uses to know where to resume from.
create table if not exists app_config (
  key         text primary key,
  value       text,
  updated_at  timestamptz not null default now()
);

comment on table app_config is 'Small key/value config store for background jobs (e.g. the Outlook reply scan''s last-run watermark). Not user-facing.';

alter table app_config enable row level security;

create policy "app_config_read_all"
  on app_config for select
  using (auth.uid() is not null);

-- No insert/update policy: only the service_role key (used by edge
-- functions) writes here.


-- 2. Audit trail for the Outlook reply scan. Unlike webhook_log (which
--    logs every AC event, matched or not), this only logs emails that
--    matched a lead — the spec calls for skipping non-matches silently,
--    and an inbox scan touches far more unrelated mail than AC's deal
--    webhook ever would, so logging every miss would drown the table.
create table if not exists outlook_reply_log (
  id            uuid primary key default uuid_generate_v4(),
  mailbox       text not null,              -- 'rus' | 'coordinator'
  lead_id       uuid references leads(id),
  from_email    text not null,
  subject       text,
  received_at   timestamptz,
  action        text not null,              -- 'status_updated' | 'further_reply' | 'error'
  detail        text,
  created_at    timestamptz not null default now()
);

comment on table outlook_reply_log is 'Audit log of matched Outlook replies (and scan errors). Non-matching inbox emails are not logged, per spec.';

create index if not exists outlook_reply_log_lead_id_idx on outlook_reply_log(lead_id);
create index if not exists outlook_reply_log_created_at_idx on outlook_reply_log(created_at);

alter table outlook_reply_log enable row level security;

create policy "outlook_reply_log_read_all"
  on outlook_reply_log for select
  using (auth.uid() is not null);


-- 3. Case-insensitive lead lookup by contact email, as a SQL function
--    rather than an `ilike` filter from the edge function — `ilike`
--    treats `_` as a single-character wildcard, and `_` is a legal
--    email local-part character (e.g. john_doe@example.com), so an
--    ilike match risks matching the WRONG lead. `lower() = lower()` has
--    no such hazard.
create or replace function find_lead_by_email(p_email text)
returns leads as $$
  select * from leads where lower(contact_email) = lower(p_email) limit 1;
$$ language sql stable;

comment on function find_lead_by_email is 'Case-insensitive lookup of a lead by contact_email. Returns null on no match. Used by the Outlook reply scan instead of an ilike filter to avoid `_`-wildcard false matches.';


-- 4. Extensions needed to schedule the scan twice daily.
--    pg_net may already be enabled (used by the AC webhook trigger);
--    pg_cron is new for this patch.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- NOTE: the actual `cron.schedule(...)` calls that wire this up are
-- deliberately NOT run by this patch — they're set up once real
-- Microsoft Graph credentials are configured and a manual test run has
-- succeeded (see README: ActiveCampaign deal sync / Outlook reply
-- detection section). Scheduling a job against a function that can't
-- yet authenticate to Graph would just generate twice-daily error noise
-- for no benefit.
