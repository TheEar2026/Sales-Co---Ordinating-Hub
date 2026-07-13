-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH
-- Run this after supabase_schema.sql.
--
-- Adds a manually-written "next action" field to leads, used by
-- the Motion A detail panel's Next Action box (a distinct field
-- from the free-form `notes` column). Additive only — does not
-- touch any existing table, column, view, or policy.
-- ============================================================

alter table leads add column if not exists next_action text;

comment on column leads.next_action is 'Manually-written next-step note shown in the Motion A detail panel''s Next Action box. Not auto-calculated.';
