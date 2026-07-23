-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 9
-- Run after patch 8. Additive columns + corrective view changes.
--
-- Adds ISASA priority ordering to the Motion B queue. Rus curated a
-- 5-band priority list for the 643 ISASA member schools inside the
-- ~3,600-lead Motion B pool (Band 1 = small non-metro primaries, a
-- low-stakes practice pool for a new coordinator, up through Band 5 =
-- RED/do-not-contact — customers or active deals Rus is already
-- handling). This patch adds the three columns needed to store that,
-- and rewires motion_b_daily so the fresh-T1 section is ordered by
-- band/completeness instead of arbitrary row order, while leaving T2/T3
-- follow-up ordering (next_touch_date) and the reply-received handover
-- priority completely unchanged.
--
-- Deliberately no traffic_light column: priority_band already encodes
-- it 1:1 for ISASA leads (bands 1-3 = GREEN, 4 = YELLOW, 5 = RED), and
-- no non-ISASA lead has a traffic-light concept today, so a separate
-- column would just be redundant data that could drift out of sync.
-- ============================================================

alter table leads add column if not exists is_isasa boolean not null default false;
alter table leads add column if not exists priority_band smallint;
alter table leads add column if not exists data_completeness smallint not null default 0;

-- Wrapped so re-running this patch after a partial failure doesn't
-- error on "constraint already exists" (unlike add column, Postgres has
-- no `add constraint if not exists`).
do $$
begin
  alter table leads add constraint priority_band_range
    check (priority_band is null or priority_band between 1 and 5);
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_leads_motion_b_priority
  on leads (is_isasa desc, priority_band asc nulls last, data_completeness desc, school_name asc)
  where is_isasa = true;

-- The leads table just gained 3 columns, which shifts where l.* lands —
-- `create or replace view` refuses that kind of shape change (same
-- reason patch 4 had to drop+recreate this view), so drop and recreate.
--
-- Wrapped in a subquery: Postgres only resolves a SELECT-list alias
-- (queue_order) as a bare ORDER BY item, not when it's referenced inside
-- a CASE expression in ORDER BY — that lookup happens against the
-- FROM-clause's real columns instead, and queue_order isn't one (it
-- errors "column queue_order does not exist"). Wrapping the case/from/
-- where in a derived table makes queue_order a genuine output column of
-- that table, so it can be referenced anywhere in the outer ORDER BY.
drop view if exists motion_b_daily;
create view motion_b_daily as
select *
from (
  select
    l.*,
    case
      when l.status = 'reply-received' then 0   -- needs handover now — always first
      when l.status = 'untouched'      then 1
      when l.status = 't1-sent'        then 2
      when l.status = 't2-sent'        then 3
      else                                   4
    end as queue_order
  from leads l
  where l.motion = 'B'
    and l.owner = 'coordinator'
    and l.status in ('untouched', 't1-sent', 't2-sent', 'reply-received')
    and (l.priority_band is null or l.priority_band != 5)   -- Band 5 = RED, never shown
    and (
      l.status in ('untouched', 'reply-received')   -- always show, regardless of date
      or l.next_touch_date <= current_date          -- t1/t2 follow-ups: only when due
    )
) t
order by
  queue_order,
  -- ISASA band/completeness ordering applies only within the untouched
  -- (fresh T1) bucket — an ISASA lead already at t1-sent/t2-sent must
  -- keep sorting by next_touch_date like every other follow-up.
  case when queue_order = 1 then (case when is_isasa then 0 else 1 end) end,
  case when queue_order = 1 then priority_band end nulls last,
  case when queue_order = 1 then data_completeness end desc,
  case when queue_order in (2, 3) then next_touch_date end asc nulls last,
  school_name asc;

comment on view motion_b_daily is 'Coordinator''s daily outreach queue. Shows untouched T1 leads (ISASA leads first, ordered by priority_band then data_completeness), follow-ups due today or overdue (ordered by next_touch_date, unaffected by ISASA status), and any lead whose reply was auto-detected and is awaiting handover confirmation. Band 5 (RED/do-not-contact) ISASA leads are excluded entirely.';

-- scorecard is built from independent scalar subqueries (no l.* select),
-- so it isn't subject to the shape-change restriction above — safe to
-- create or replace, same as patches 2/6/7 did.
create or replace view scorecard as
select
  (select count(distinct lower(trim(school_name))) from leads where status = 'won') as paying_schools,
  (select count(*) from leads where motion = 'A' and status not in ('won','lost','declined','blocked','parked')) as motion_a_pipeline,
  (select count(*) from leads where motion = 'B' and status = 'untouched')             as motion_b_untouched,
  (select count(*) from leads where motion = 'B' and status != 'untouched')            as motion_b_touched,
  (select count(*) from sponsorship_slots where status = 'placed')                     as sponsor_slots_placed,
  (select count(*) from sponsorship_slots)                                             as sponsor_slots_total,
  (select count(*) from leads where status = 'reply-received' and owner = 'rus')       as pending_handovers,
  (select round(
    count(*) filter (where replied = true)::numeric /
    nullif(count(*), 0) * 100, 1
  ) from touch_log where sent_date >= current_date - interval '90 days')              as reply_rate_90d,
  (select count(*) from leads where needs_review = true)                               as needs_review_count,
  (select count(*) from leads where is_isasa = true and priority_band != 5 and status != 'untouched') as isasa_touched,
  (select count(*) from leads where is_isasa = true and priority_band != 5)             as isasa_total;

comment on view scorecard is 'Single-row view of the key numbers shown in the scorecard strip. paying_schools counts distinct schools (case/whitespace-insensitive), not raw won-lead rows. isasa_total is bands 1-4 only (Band 5/RED is never sendable, so it is excluded from the denominator too).';

comment on column leads.is_isasa is 'True for the 643 ISASA member schools identified in the Q3 priority backfill. False/default for every other lead.';
comment on column leads.priority_band is 'ISASA outreach priority, 1 (highest) to 5 (RED/do-not-contact). NULL for non-ISASA leads. Band 5 leads are excluded from the Motion B queue entirely.';
comment on column leads.data_completeness is '0-6 score capturing how much contact info was already found for this lead during the ISASA research pass. Higher sorts first within a band so leads that are ready to send go before ones still needing enrichment.';
