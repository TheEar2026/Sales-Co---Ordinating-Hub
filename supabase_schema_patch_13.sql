-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 13
-- Run after patch 12. Corrective view change, no table changes.
--
-- motion_b_daily's WHERE clause hid any t1-sent/t2-sent lead from the
-- queue entirely (not just its section — nowhere at all) unless
-- next_touch_date <= current_date. markSent() (ComposePanel.tsx) flips
-- status the moment Badi clicks "Sent" but never sets next_touch_date
-- — that's a separate manual DatePicker action — so a lead sent
-- without also setting a follow-up date simply vanished from the
-- queue until someone went back and set one.
--
-- Fix: drop the date gate from the WHERE clause (every t1-sent/t2-sent
-- lead stays visible now) and add needs_followup_now as a plain
-- SELECT-list column instead. The client (OutreachQueue.tsx) uses that
-- column to split each T2/T3 section into "send today" vs "scheduled"
-- sub-sections, so leads due today are structurally separated rather
-- than merely sorted first in a mixed list.
--
-- This only appends a trailing SELECT-list column — it doesn't change
-- the shape of leads.* the way patch 9's new columns did — so a plain
-- `create or replace view` works; no drop+recreate needed.
-- ============================================================

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
      else                                   4
    end as queue_order,
    (l.next_touch_date is not null and l.next_touch_date <= current_date) as needs_followup_now
  from leads l
  where l.motion = 'B'
    and l.owner = 'coordinator'
    and l.status in ('untouched', 't1-sent', 't2-sent', 'reply-received')
    and (l.priority_band is null or l.priority_band != 5)   -- Band 5 = RED, never shown
    -- no next_touch_date gate here anymore — a t1-sent/t2-sent lead
    -- stays visible regardless of date; needs_followup_now (above)
    -- flags urgency instead of hiding the lead
) t
order by
  queue_order,
  -- ISASA band/completeness ordering applies only within the untouched
  -- (fresh T1) bucket — an ISASA lead already at t1-sent/t2-sent must
  -- keep sorting by next_touch_date like every other follow-up.
  case when queue_order = 1 then (case when is_isasa then 0 else 1 end) end,
  case when queue_order = 1 then priority_band end nulls last,
  case when queue_order = 1 then data_completeness end desc,
  -- Unchanged from patch 9: this already orders each of the client's
  -- due/scheduled sub-groups sensibly on its own (most-overdue-first
  -- within "due", soonest-upcoming-first within "scheduled") — no
  -- separate due-first bucket needed since the split now happens
  -- client-side, not here.
  case when queue_order in (2, 3) then next_touch_date end asc nulls last,
  school_name asc;

comment on view motion_b_daily is 'Coordinator''s daily outreach queue. Shows untouched T1 leads (ISASA leads first, ordered by priority_band then data_completeness), every t1-sent/t2-sent lead awaiting its next touch (no longer hidden until next_touch_date arrives — needs_followup_now flags due/overdue leads for the client to split into a "send today" group instead of hiding them), and any lead whose reply was auto-detected and is awaiting handover confirmation. Band 5 (RED/do-not-contact) ISASA leads are excluded entirely.';
