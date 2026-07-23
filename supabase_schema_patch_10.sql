-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 10
-- Run after patch 9. Corrective only — no new columns.
--
-- Patch 9 excluded Band 5 (RED/do-not-contact) ISASA leads from the
-- motion_b_daily queue, but scorecard.motion_b_untouched still counted
-- them (it queries leads directly, with no priority_band filter). This
-- surfaced immediately in production: the Motion B tile read 3606
-- untouched (from the actual queue) while the Scorecard card read 3621
-- (15 higher — exactly the Band 5 count) for the same concept. Same
-- class of bug as the original Motion A/B tile-vs-tab mismatch this
-- project fixed earlier — reintroduced here by the Band 5 exclusion.
--
-- Fix: motion_b_untouched and motion_b_touched both exclude Band 5, so
-- they only ever describe the pool Badi can actually see and work.
-- ============================================================

create or replace view scorecard as
select
  (select count(distinct lower(trim(school_name))) from leads where status = 'won') as paying_schools,
  (select count(*) from leads where motion = 'A' and status not in ('won','lost','declined','blocked','parked')) as motion_a_pipeline,
  (select count(*) from leads where motion = 'B' and status = 'untouched' and (priority_band is null or priority_band != 5)) as motion_b_untouched,
  (select count(*) from leads where motion = 'B' and status != 'untouched' and (priority_band is null or priority_band != 5)) as motion_b_touched,
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

comment on view scorecard is 'Single-row view of the key numbers shown in the scorecard strip. paying_schools counts distinct schools (case/whitespace-insensitive), not raw won-lead rows. motion_b_untouched/touched exclude Band 5 (RED/do-not-contact) ISASA leads, matching what motion_b_daily actually shows Badi. isasa_total is bands 1-4 only.';
