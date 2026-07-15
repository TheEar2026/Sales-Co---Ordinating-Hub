-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 2
-- Run this after supabase_schema.sql and supabase_schema_patch.sql.
-- Additive only — does not touch existing data.
--
-- Supports the ActiveCampaign → Supabase deal-sync webhook
-- (supabase/functions/ac-deal-webhook).
-- ============================================================

-- 1. Audit trail of every inbound AC webhook event — what fired,
--    what it mapped to, and whether it touched a lead. Kept even for
--    ignored/error events so the sync can be debugged from the data
--    alone, without digging through function logs.
create table if not exists webhook_log (
  id                uuid primary key default uuid_generate_v4(),
  source            text not null default 'activecampaign',
  deal_id           text,
  pipeline_id       text,
  stage_received    text,
  status_set        text,
  action            text not null,   -- 'updated' | 'created' | 'ignored' | 'error'
  detail            text,
  raw_payload       jsonb,
  created_at        timestamptz not null default now()
);

comment on table webhook_log is 'Audit log of inbound webhook events (AC deal-stage sync, etc). One row per event received, regardless of outcome.';

create index if not exists webhook_log_deal_id_idx    on webhook_log(deal_id);
create index if not exists webhook_log_created_at_idx on webhook_log(created_at);

alter table webhook_log enable row level security;

create policy "webhook_log_read_all"
  on webhook_log for select
  using (auth.uid() is not null);

-- No insert/update policies: only the service_role key (used by the
-- edge function) writes here, and service_role bypasses RLS entirely.


-- 2. Support fields on leads for the AC sync:
--    - needs_review: set when the webhook auto-creates a lead it
--      couldn't find by ac_deal_id, so a human confirms the details.
--    - review_reason: why it was flagged.
--    - ac_deal_currency: the AC deal's currency. The Sales Conversion
--      pipeline holds deals in more than one currency (ZAR/GBP/USD
--      observed) — ac_deal_value alone doesn't say which, so record
--      it explicitly rather than assuming ZAR.
alter table leads add column if not exists needs_review boolean not null default false;
alter table leads add column if not exists review_reason text;
alter table leads add column if not exists ac_deal_currency text;

comment on column leads.needs_review is 'True when this lead needs a human check — e.g. auto-created from an AC webhook with no existing match.';
comment on column leads.review_reason is 'Human-readable reason needs_review was set.';
comment on column leads.ac_deal_currency is 'Currency of ac_deal_value as reported by ActiveCampaign (e.g. ZAR, GBP, USD). Not assumed — the AC pipeline holds deals in multiple currencies.';

-- Webhook lookups are keyed on ac_deal_id — index it.
create index if not exists leads_ac_deal_id_idx on leads(ac_deal_id);


-- 3. Surface needs_review on the scorecard so an auto-created lead
--    can never go unnoticed just because its status/motion happens
--    to fall outside the Motion A / Motion B list filters (e.g. a
--    lead auto-created from a Lost deal with no motion/owner set).
--    Appends one column — safe with existing readers of this view.
create or replace view scorecard as
select
  (select count(*) from leads where status = 'won')                                     as paying_schools,
  (select count(*) from leads where motion = 'A' and status not in ('won','lost','declined','blocked','parked')) as motion_a_pipeline,
  (select count(*) from leads where motion = 'B' and status = 'untouched')              as motion_b_untouched,
  (select count(*) from leads where motion = 'B' and status != 'untouched')             as motion_b_touched,
  (select count(*) from sponsorship_slots where status = 'placed')                      as sponsor_slots_placed,
  (select count(*) from sponsorship_slots)                                               as sponsor_slots_total,
  (select count(*) from leads where status = 'reply-received' and owner = 'rus')        as pending_handovers,
  (select round(
    count(*) filter (where replied = true)::numeric /
    nullif(count(*), 0) * 100, 1
  ) from touch_log where sent_date >= current_date - interval '90 days')               as reply_rate_90d,
  (select count(*) from leads where needs_review = true)                                as needs_review_count;
