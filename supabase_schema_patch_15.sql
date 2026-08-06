-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 15
-- Run after patch 14. Adds a new persona (P7 — Creative Arts,
-- cross-profile) and its three-touch template sequence.
--
-- Context: Rus wants an outreach sequence aimed at Creative Arts /
-- classroom teachers specifically, sendable regardless of which of
-- P1-P6 the school otherwise fits. He initially suggested reusing P6,
-- but P6 already has real, active content ("School Group") and the
-- templates table enforces one active template per persona+touch
-- combination — reusing P6 would force deactivating that live email.
-- A new, distinct persona code avoids the collision entirely and
-- needs no other plumbing: lead.persona is a single dropdown-driven
-- field, and every consumer (ComposePanel.tsx, QueueCard.tsx,
-- AllLeadsDetail.tsx) already reads it generically.
--
-- persona_code is a real Postgres enum, so — same restriction as
-- patch 14's lead_status extension — a new value can't be referenced
-- by a query in the same transaction that added it.
--
-- IMPORTANT — run this in TWO SEPARATE STEPS. Run STEP 1 alone, wait
-- for it to report Success, THEN run STEP 2.
-- ============================================================

-- ---------------------------------------------------------------
-- STEP 1 — run this alone first, then wait for Success before
-- continuing to STEP 2.
-- ---------------------------------------------------------------
alter type persona_code add value if not exists 'P7';

-- ---------------------------------------------------------------
-- STEP 2 — run this only after STEP 1 has succeeded.
-- ---------------------------------------------------------------
insert into templates (persona, touch_number, template_type, name, subject, body) values
('P7', 'T1', 'intro', 'P7 T1 — Creative Arts (Cross-Profile)',
 'Supporting music in your Creative Arts classroom',
 'Hi {{first_name}},

The Ear Academy is a music resource library and CPD platform for schools, built so Creative Arts and classroom teachers can deliver confident, structured music lessons without needing to be a music specialist themselves, whether music is already part of your school''s offering or you''re just getting started.

CAPS-aligned lessons come complete with plans, slides and resources, and built-in SACE-accredited professional development builds your confidence as you teach, not before you start. It''s also part of the well-rounded education parents look for.

Here''s a short overview of what''s included and how it could fit into your Creative Arts programme: https://canva.link/a0b9ocqcta36py6

Are you available in the next few days for an online call? I''d love to show you the platform and explore what it could look like in your Creative Arts classroom.

Best,
Rus Nerwich
The Ear Academy'),

('P7', 'T2', 'followup', 'P7 T2 — Creative Arts Follow-up',
 'Re: Supporting music in your Creative Arts classroom',
 'Hi {{first_name}},

Circling back on this, in case it got buried last week.

The Ear Academy is a music resource library and CPD platform for schools, built so Creative Arts and classroom teachers can deliver confident, structured music lessons without needing to be a music specialist themselves, whether music is already part of your school''s offering or you''re just getting started.

CAPS-aligned lessons come complete with plans, slides and resources, and built-in SACE-accredited professional development builds your confidence as you teach, not before you start. It''s also part of the well-rounded education parents look for.

Here''s a short overview of what''s included and how it could fit into your Creative Arts programme: https://canva.link/a0b9ocqcta36py6

Are you available in the next few days for an online call? I''d love to show you the platform and explore what it could look like in your Creative Arts classroom.

Best,
Rus Nerwich
The Ear Academy'),

('P7', 'T3', 'followup', 'P7 T3 — Creative Arts Third Touch',
 'Did this reach you?',
 'Hi {{first_name}},

Did my last couple of emails reach you? Term-time inboxes move fast, so it''s entirely possible they got buried.

I''m biased, obviously — but I think if you saw what''s available in the platform, you''d find it genuinely exciting for your Creative Arts classroom, not just useful.

Are you free for a short call this week or next?

Best,
Rus Nerwich
The Ear Academy');
