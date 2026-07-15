-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 4
-- Run after patch 3. Corrective only — no new tables.
--
-- Fixes a gap exposed by the Outlook reply-detection integration:
-- motion_b_daily's status filter never included 'reply-received',
-- because before that integration existed, 'reply-received' was only
-- ever set by handle_handover() — in the same transaction that also
-- reassigns owner to 'rus'. So a reply-received lead never stayed
-- owned by the coordinator long enough to need showing in her queue.
--
-- The Outlook scan breaks that assumption on purpose: it sets
-- status = 'reply-received' while leaving owner = 'coordinator' and
-- motion = 'B' untouched, so a human still has to confirm the handover
-- (per spec — only touch/next-date/notes/handover-confirm stay manual).
-- Without this fix, such a lead was invisible in the app: not in
-- motion_b_daily (status excluded), not in motion_a_daily (owner still
-- 'coordinator'), and not in the pending_handovers scorecard count
-- (same owner check) — nobody could act on an auto-detected reply.
-- ============================================================

-- The leads table has gained columns via later patches (next_action,
-- needs_review, etc.) since this view was first created, which shifts
-- where l.* columns land — `create or replace view` refuses that kind
-- of shape change, so drop and recreate instead.
drop view if exists motion_b_daily;
create view motion_b_daily as
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
  and (
    l.status in ('untouched', 'reply-received')   -- always show, regardless of date
    or l.next_touch_date <= current_date          -- t1/t2 follow-ups: only when due
  )
order by queue_order, l.next_touch_date asc nulls last;

comment on view motion_b_daily is 'Coordinator''s daily outreach queue. Shows untouched T1 leads, follow-ups due today or overdue, and any lead whose reply was auto-detected (Outlook scan) and is awaiting handover confirmation.';
