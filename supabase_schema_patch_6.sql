-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 6
-- Run after patch 5. Corrective only — no new tables.
--
-- paying_schools counted leads (count(*)), not distinct schools.
-- A single school can have more than one won lead (e.g. separate
-- contacts/programs), so a school with 3 won leads was counted
-- as 3 "paying schools" instead of 1. Switched to
-- count(distinct school_name) so each school counts once no
-- matter how many won leads it has.
-- ============================================================

create or replace view scorecard as
select
  (select count(distinct school_name) from leads where status = 'won')                as paying_schools,
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
  (select count(*) from leads where needs_review = true)                               as needs_review_count;

comment on view scorecard is 'Single-row view of the key numbers shown in the scorecard strip. paying_schools counts distinct schools, not raw won-lead rows.';
