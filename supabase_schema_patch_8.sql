-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 8
-- Run after patch 7. Additive only — does not touch existing data.
--
-- Adds contact_phone so a phone number can be recorded once Badi (or
-- Rus) finds/confirms it — the leads table had no phone field at all
-- before this, so it was previously dropped on import (see the Badi
-- pool intake — Phone was ~43% Excel-corrupted anyway and had nowhere
-- to go).
-- ============================================================

alter table leads add column if not exists contact_phone text;

comment on column leads.contact_phone is 'Contact phone number, filled in as a lead gets researched/confirmed. No format enforced.';
