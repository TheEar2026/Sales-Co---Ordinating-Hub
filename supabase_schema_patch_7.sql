-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 7
-- Run after patch 6. Corrective only — no new tables.
--
-- count(distinct school_name) still overcounted: "Eduplex" (2
-- leads) and "EDUPLEX" (1 lead) are the same school but different
-- exact text, so Postgres's DISTINCT treated them as two schools
-- (8 shown instead of the real 7). school_name is free text with
-- no schools table/normalization behind it, so case and stray
-- whitespace differences are expected to happen again — count on
-- lower(trim(school_name)) instead of the raw column so this
-- class of mismatch can't recur.
-- ============================================================

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
  (select count(*) from leads where needs_review = true)                               as needs_review_count;

comment on view scorecard is 'Single-row view of the key numbers shown in the scorecard strip. paying_schools counts distinct schools (case/whitespace-insensitive), not raw won-lead rows.';
