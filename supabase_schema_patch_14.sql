-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 14
-- Run after patch 13. Adds T4/T5 as a temporary stopgap so leads
-- that have exhausted T1-T3 don't fall into permanent invisible
-- limbo, while a longer-term redesign is worked out.
--
-- Context: once T3 is sent, a Motion B lead's status becomes
-- 't3-sent' — a status motion_b_daily's WHERE clause has never
-- included, so those leads vanish from Badi's queue forever with no
-- further automated follow-up prompt (confirmed: 53 leads are
-- currently stuck there in production). Per Rus, this patch is
-- explicitly temporary — "buy ourselves time to solve in a more
-- long-term way" — extending the exact same due-today/scheduled
-- pattern from patch 13 two touches further, not redesigning the
-- sequence.
--
-- Decisions confirmed with Rus:
--   - No new template copy for T4/T5 yet. ComposePanel already works
--     without a template selected (the "Sent — mark done" button was
--     freed of that requirement earlier), so Badi can freehand these
--     until real copy exists.
--   - Once a lead reaches t5-sent, it stays visible indefinitely —
--     there is deliberately no T6 automation. It only leaves the
--     queue if someone parks it.
--
-- IMPORTANT — run this in TWO SEPARATE STEPS, not as one paste-and-
-- run like previous patches. Postgres will not let a query reference
-- a brand-new enum value in the same transaction that added it
-- ("unsafe use of new value of enum type"). Run STEP 1 alone, wait
-- for it to report Success, THEN run STEP 2.
-- ============================================================

-- ---------------------------------------------------------------
-- STEP 1 — run this alone first, then wait for Success before
-- continuing to STEP 2.
-- ---------------------------------------------------------------
alter type lead_status add value if not exists 't4-sent';
alter type lead_status add value if not exists 't5-sent';

-- ---------------------------------------------------------------
-- STEP 2 — run this only after STEP 1 has succeeded.
-- ---------------------------------------------------------------
create or replace view motion_b_daily as
select *
from (
  select
    l.*,
    case
      when l.status = 'reply-received' then 0   -- needs handover now — always first
      when l.status = 'untouched'      then 1
      when l.status = 't1-sent'        then 2
      when l.status = 't2-sent'        then 3
      when l.status = 't3-sent'        then 4   -- T4 due
      when l.status = 't4-sent'        then 5   -- T5 due
      when l.status = 't5-sent'        then 6   -- T5 sent, stays visible until parked
      else                                   7
    end as queue_order,
    (l.next_touch_date is not null and l.next_touch_date <= current_date) as needs_followup_now
  from leads l
  where l.motion = 'B'
    and l.owner = 'coordinator'
    and l.status in ('untouched', 't1-sent', 't2-sent', 't3-sent', 't4-sent', 't5-sent', 'reply-received')
    and (l.priority_band is null or l.priority_band != 5)   -- Band 5 = RED, never shown
) t
order by
  queue_order,
  case when queue_order = 1 then (case when is_isasa then 0 else 1 end) end,
  case when queue_order = 1 then priority_band end nulls last,
  case when queue_order = 1 then data_completeness end desc,
  case when queue_order in (2, 3, 4, 5, 6) then next_touch_date end asc nulls last,
  school_name asc;

comment on view motion_b_daily is 'Coordinator''s daily outreach queue. Shows untouched T1 leads (ISASA leads first, ordered by priority_band then data_completeness), every t1-sent through t5-sent lead awaiting its next touch (needs_followup_now flags due/overdue leads for the client to split into a "send today" group instead of hiding them — t5-sent leads stay visible indefinitely as a temporary stopgap until parked), and any lead whose reply was auto-detected and is awaiting handover confirmation. Band 5 (RED/do-not-contact) ISASA leads are excluded entirely.';
