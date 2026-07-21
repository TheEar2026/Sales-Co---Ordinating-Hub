-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 5
-- Run after patch 4. Corrective only — no new tables.
--
-- motion_a_daily filtered only on owner = 'rus', never on
-- motion = 'A' itself (motion_b_daily already checks motion =
-- 'B' explicitly — this view was the odd one out). Almost every
-- Motion A lead is also owned by Rus, so this went unnoticed,
-- but the two fields aren't guaranteed to match: a Motion B
-- lead can end up owned by rus without motion being updated to
-- 'A' (or vice versa). That let at least one Motion B lead sit
-- in Rus's Motion A daily list, counted in the Motion A tile
-- and tab, when it shouldn't have been.
--
-- Any lead this affects (owner = rus, motion = B, or owner =
-- coordinator, motion = A) will now correctly disappear from
-- both motion_a_daily and motion_b_daily — motion_b_daily still
-- requires owner = 'coordinator', so a stray owner/motion
-- mismatch won't silently land back in the wrong queue. It
-- stays fully visible and editable in the All Leads browse view
-- either way, for a human to reconcile which field is wrong.
-- ============================================================

drop view if exists motion_a_daily;
create view motion_a_daily as
select
  l.*,
  (current_date - l.last_touch_date) as days_since_last_touch,
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
order by priority_order, days_since_last_touch desc nulls last;

comment on view motion_a_daily is 'Rus''s daily working list. Filters on both motion = ''A'' and owner = ''rus'' (not owner alone) so a mismatched lead can''t slip in. Ordered by status priority then by days silent (most urgent first).';
