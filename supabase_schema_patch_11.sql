-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 11
-- Run after patch 10. Corrective only — no new columns.
--
-- motion_a_daily's "Next touch" date field (set via the DatePicker in
-- Motion A's DetailFooter) was purely informational — it was stored on
-- the lead but never referenced by the view's ordering, unlike Motion
-- B's next_touch_date, which already gates T2/T3 visibility. A lead
-- with a follow-up date of today or earlier didn't rise in the list on
-- its own; it only got more urgent gradually as days_since_last_touch
-- grew, regardless of the specific date Rus picked. Confirmed directly
-- against the live view definition while investigating why 3 leads
-- touched the same day didn't behave as expected.
--
-- Fix: add needs_followup (true when next_touch_date is set and has
-- arrived) as its own top-level ordering bucket, ahead of the existing
-- status-tier/days-silent ordering — mirrors motion_b_daily's
-- reply-received-always-first pattern. Also exposed as a column so the
-- lead card can show a small "Follow up" indicator.
-- ============================================================

drop view if exists motion_a_daily;
create view motion_a_daily as
select
  l.*,
  (current_date - l.last_touch_date) as days_since_last_touch,
  (l.next_touch_date is not null and l.next_touch_date <= current_date) as needs_followup,
  case
    when l.status = 'close'            then 1
    when l.status = 'reply-received'   then 2
    when l.status = 'demo-booked'      then 3
    when l.status = 'proposal-sent'    then 4
    when l.status = 'negotiation'      then 5
    when l.status = 'demo-held'        then 6
    when l.tier   = 'HOT'              then 7
    else                                    8
  end as priority_order
from leads l
where l.motion = 'A'
  and l.owner = 'rus'
  and l.status not in ('won', 'lost', 'declined', 'blocked', 'parked')
order by
  case when l.next_touch_date is not null and l.next_touch_date <= current_date then 0 else 1 end,
  priority_order,
  days_since_last_touch desc nulls last;

comment on view motion_a_daily is 'Rus''s daily working list. Leads with a next_touch_date that has arrived (or passed) always come first, ordered by needs_followup, then status priority, then days silent (most urgent first) within each group.';
