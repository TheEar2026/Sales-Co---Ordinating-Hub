-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH
-- Run this after supabase_schema.sql (paste into the SQL Editor).
-- Additive only — does not touch existing data.
-- ============================================================

-- 1. Manually-written "next action" field for the Motion A detail
--    panel's Next Action box (distinct from the free-form notes).
alter table leads add column if not exists next_action text;

comment on column leads.next_action is 'Manually-written next-step note shown in the Motion A detail panel''s Next Action box. Not auto-calculated.';

-- 2. Enable realtime replication so both users see each other's
--    changes instantly. Without this, postgres_changes events never
--    fire and the app only updates on user action / 60s polling.
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table handover_events;
