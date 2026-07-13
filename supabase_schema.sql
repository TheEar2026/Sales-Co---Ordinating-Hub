-- ============================================================
-- EAR ACADEMY SALES SYSTEM — SUPABASE SCHEMA
-- Paste this entire file into the Supabase SQL Editor and run.
-- Run sections in order. Do not skip sections.
-- ============================================================


-- ============================================================
-- SECTION 1: EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp";


-- ============================================================
-- SECTION 2: ENUMS
-- Defined values for fields that must match a fixed set.
-- ============================================================

-- Who owns a lead at any point in time
create type owner_type as enum ('rus', 'coordinator');

-- Which motion a lead belongs to
create type motion_type as enum ('A', 'B', 'sponsorship');

-- Every state a lead can be in, in sequence
create type lead_status as enum (
  'untouched',        -- Motion B: never contacted
  't1-sent',          -- Motion B: first touch sent, awaiting reply
  't2-sent',          -- Motion B: follow-up sent, awaiting reply
  't3-sent',          -- Motion B: third touch sent, awaiting reply
  'reply-received',   -- Trigger for handover: school has replied with interest
  'demo-booked',      -- Demo scheduled
  'demo-held',        -- Demo has taken place
  'proposal-sent',    -- Xero quote / SLT proposal sent
  'negotiation',      -- Active negotiation in progress
  'close',            -- Verbal agreement, awaiting signature/payment
  'won',              -- School is a paying customer
  'lost',             -- Deal is dead
  'parked',           -- Deliberately paused (timing issue, wrong contact)
  'declined',         -- School explicitly said no
  'blocked'           -- Bounced, undeliverable, or unreachable
);

-- Persona codes from the 6-persona framework
create type persona_code as enum ('P1', 'P2', 'P3', 'P4', 'P5', 'P6');

-- Touch number for outreach sequence
create type touch_number as enum ('T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8');

-- Template type
create type template_type as enum ('intro', 'followup', 'post-demo', 'proposal', 'objection', 'requalify');


-- ============================================================
-- SECTION 3: CORE TABLES
-- ============================================================

-- ------------------------------------------------------------
-- 3a. USERS
-- Tracks the two human users of the system: Rus and the coordinator.
-- Supabase Auth handles login; this table stores their roles.
-- ------------------------------------------------------------

create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  full_name     text not null,
  role          owner_type not null,
  created_at    timestamptz not null default now()
);

comment on table users is 'System users: Rus (owner: rus) and the Sales Coordinator (owner: coordinator). Roles drive what each person sees in the dashboard.';


-- ------------------------------------------------------------
-- 3b. LEADS
-- The central table. One row per school contact.
-- ------------------------------------------------------------

create table leads (
  id                    uuid primary key default uuid_generate_v4(),

  -- Identity
  contact_name          text not null,
  contact_email         text,
  contact_role          text,                          -- e.g. "Principal", "Head of Music", "HOD"
  school_name           text not null,
  school_province       text,
  school_type           text,                          -- e.g. "Independent prep", "Government high"

  -- Segmentation
  persona               persona_code,
  motion                motion_type not null default 'B',
  tier                  text,                          -- CLOSE, HOT, ACTIVE, WARM, COLD, NURTURE, PARKED, etc.

  -- Ownership and state
  owner                 owner_type not null default 'coordinator',
  status                lead_status not null default 'untouched',

  -- Pipeline linkage
  ac_deal_id            integer,                       -- ActiveCampaign deal ID for cross-reference
  ac_deal_value         numeric(10,2),                 -- Deal value in ZAR
  ac_deal_stage         text,                          -- Demo/Pilot, Negotiation, Agreed

  -- Scheduling
  next_touch_date       date,                          -- Set by judgement, not auto-calculated
  demo_date             timestamptz,                   -- Set by coordinator when booking
  demo_booked_by        owner_type,                    -- Who booked it

  -- Tracking
  touch_count           integer not null default 0,
  last_touch_date       date,
  last_reply_date       date,
  first_reply_date      date,

  -- Notes
  notes                 text,                          -- Running notes, updated each session
  source                text,                          -- How this lead entered the system: 'sprint-q2', 'referral', 'inbound', etc.
  source_motion         motion_type,                   -- Which motion originally generated this lead

  -- Metadata
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table leads is 'One row per school contact. Central table for all pipeline tracking. owner and motion fields drive which view the lead appears in. Status field drives the handover flow.';

-- Index on the fields queried most frequently
create index leads_owner_idx           on leads(owner);
create index leads_motion_idx          on leads(motion);
create index leads_status_idx          on leads(status);
create index leads_next_touch_idx      on leads(next_touch_date);
create index leads_tier_idx            on leads(tier);
create index leads_persona_idx         on leads(persona);


-- ------------------------------------------------------------
-- 3c. TOUCH LOG
-- One row per outbound email or call attempt.
-- This is the audit trail. It does not replace the status field
-- on leads — it supplements it with a full history.
-- ------------------------------------------------------------

create table touch_log (
  id              uuid primary key default uuid_generate_v4(),
  lead_id         uuid not null references leads(id) on delete cascade,

  touch_number    touch_number not null,               -- T1, T2, T3...
  sent_by         owner_type not null,                 -- Who sent this touch
  sent_date       date not null default current_date,
  channel         text not null default 'email',       -- email, whatsapp, call, in-person

  -- Reply tracking
  replied         boolean not null default false,
  reply_date      date,
  reply_summary   text,                                -- Brief note on what the reply said

  -- Template used
  template_id     uuid references templates(id),

  -- Metadata
  created_at      timestamptz not null default now()
);

comment on table touch_log is 'Immutable audit trail of every outbound contact attempt. One row per touch. Never update rows here — only insert.';

create index touch_log_lead_idx   on touch_log(lead_id);
create index touch_log_date_idx   on touch_log(sent_date);


-- ------------------------------------------------------------
-- 3d. TEMPLATES
-- The email template library. Editable by Rus only.
-- One row per persona + touch number combination.
-- ------------------------------------------------------------

create table templates (
  id              uuid primary key default uuid_generate_v4(),

  -- Classification
  persona         persona_code not null,
  touch_number    touch_number not null,
  template_type   template_type not null default 'intro',
  name            text not null,                       -- Human-readable name, e.g. "P1 T1 — Established Music Dept"

  -- Content
  subject         text not null,
  body            text not null,                       -- Supports merge fields: {{first_name}}, {{school_name}}, {{contact_role}}

  -- Status
  is_active       boolean not null default true,
  version         integer not null default 1,

  -- Metadata
  created_by      uuid references users(id),
  updated_by      uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Enforce uniqueness: one active template per persona + touch combination
  unique (persona, touch_number, is_active)
);

comment on table templates is 'Email template library. Editable by Rus only (enforced via RLS). Merge fields: {{first_name}}, {{school_name}}, {{contact_role}}. One active template per persona+touch combination.';


-- ------------------------------------------------------------
-- 3e. HANDOVER EVENTS
-- Immutable log of every lead transfer between users.
-- This is the audit trail for the coordinator → Rus handover flow.
-- ------------------------------------------------------------

create table handover_events (
  id                  uuid primary key default uuid_generate_v4(),
  lead_id             uuid not null references leads(id) on delete cascade,

  from_owner          owner_type not null,
  to_owner            owner_type not null,
  from_motion         motion_type not null,
  to_motion           motion_type not null,
  from_status         lead_status not null,
  to_status           lead_status not null,

  -- Context
  triggered_by        uuid references users(id),       -- Who clicked the button
  demo_date           timestamptz,                     -- Demo date set at handover time
  notes               text,                            -- Optional note from coordinator

  -- Notification
  notification_sent   boolean not null default false,
  notification_sent_at timestamptz,

  created_at          timestamptz not null default now()
);

comment on table handover_events is 'Immutable log of every lead transfer. Written automatically when the coordinator clicks "Flag for Rus". The Supabase webhook that triggers the Resend email fires on INSERT to this table.';

create index handover_lead_idx on handover_events(lead_id);


-- ------------------------------------------------------------
-- 3f. SPONSORSHIP SLOTS
-- Tracks the 12 committed sponsorship placements separately
-- from the main lead pipeline.
-- ------------------------------------------------------------

create table sponsorship_slots (
  id                  uuid primary key default uuid_generate_v4(),

  slot_number         integer not null unique,          -- 1 through 12
  sponsor_name        text,                             -- Name of the sponsoring organisation

  -- Placement state
  status              text not null default 'unplaced', -- unplaced, identified, contacted, placed, activated
  school_name         text,
  contact_name        text,
  contact_email       text,
  lead_id             uuid references leads(id),        -- Link to leads table if school is also a lead

  -- Timeline
  identified_date     date,
  contacted_date      date,
  placed_date         date,
  activated_date      date,

  -- Notes
  notes               text,
  next_action         text,
  next_action_date    date,

  -- Metadata
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table sponsorship_slots is '12 committed sponsorship placements. Tracked separately from the main sales pipeline. Weekly review cadence, not daily.';

-- Seed the 12 empty slots immediately
insert into sponsorship_slots (slot_number, status) values
  (1, 'placed'),   -- Hillcrest Primary — already placed
  (2, 'unplaced'),
  (3, 'unplaced'),
  (4, 'unplaced'),
  (5, 'unplaced'),
  (6, 'unplaced'),
  (7, 'unplaced'),
  (8, 'unplaced'),
  (9, 'unplaced'),
  (10, 'unplaced'),
  (11, 'unplaced'),
  (12, 'unplaced');

-- Update slot 1 with Hillcrest detail
update sponsorship_slots set
  school_name = 'Hillcrest Primary School',
  contact_name = 'Baatjies',
  notes = 'Demo completed Jun 2026. First placed sponsorship slot.',
  placed_date = '2026-06-02'
where slot_number = 1;


-- ============================================================
-- SECTION 4: UPDATED_AT TRIGGER
-- Automatically sets updated_at on every row update.
-- Applied to leads, templates, and sponsorship_slots.
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

create trigger templates_updated_at
  before update on templates
  for each row execute function set_updated_at();

create trigger sponsorship_slots_updated_at
  before update on sponsorship_slots
  for each row execute function set_updated_at();


-- ============================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- Controls what each user can see and do.
-- Both users can read all leads.
-- Write permissions are restricted by role.
-- ============================================================

-- Enable RLS on all tables
alter table users              enable row level security;
alter table leads              enable row level security;
alter table touch_log          enable row level security;
alter table templates          enable row level security;
alter table handover_events    enable row level security;
alter table sponsorship_slots  enable row level security;

-- Helper function: get the current user's role
create or replace function current_user_role()
returns owner_type as $$
  select role from users where id = auth.uid();
$$ language sql security definer;


-- LEADS policies
-- Both users can read all leads
create policy "leads_read_all"
  on leads for select
  using (auth.uid() is not null);

-- Coordinator can only update leads they own (or that are Motion B)
create policy "leads_coordinator_update"
  on leads for update
  using (
    current_user_role() = 'coordinator'
    and (owner = 'coordinator' or motion = 'B')
  );

-- Rus can update any lead
create policy "leads_rus_update"
  on leads for update
  using (current_user_role() = 'rus');

-- Only Rus can insert new leads (coordinator uses the system to work existing ones)
create policy "leads_rus_insert"
  on leads for insert
  with check (current_user_role() = 'rus');


-- TEMPLATES policies
-- Both users can read templates
create policy "templates_read_all"
  on templates for select
  using (auth.uid() is not null);

-- Only Rus can create, update, or delete templates
create policy "templates_rus_write"
  on templates for all
  using (current_user_role() = 'rus');


-- TOUCH LOG policies
-- Both users can read and insert touch log entries
create policy "touch_log_read_all"
  on touch_log for select
  using (auth.uid() is not null);

create policy "touch_log_insert_all"
  on touch_log for insert
  with check (auth.uid() is not null);

-- Touch log rows are never updated or deleted (immutable audit trail)


-- HANDOVER EVENTS policies
-- Both users can read handover history
create policy "handover_read_all"
  on handover_events for select
  using (auth.uid() is not null);

-- Both users can insert handover events (coordinator does the flagging)
create policy "handover_insert_all"
  on handover_events for insert
  with check (auth.uid() is not null);


-- SPONSORSHIP SLOTS policies
-- Both users can read
create policy "sponsorship_read_all"
  on sponsorship_slots for select
  using (auth.uid() is not null);

-- Only Rus can update sponsorship slots
create policy "sponsorship_rus_update"
  on sponsorship_slots for update
  using (current_user_role() = 'rus');


-- USERS policies
-- Users can read their own record
create policy "users_read_own"
  on users for select
  using (id = auth.uid());

-- Rus can read all user records
create policy "users_rus_read_all"
  on users for select
  using (current_user_role() = 'rus');


-- ============================================================
-- SECTION 6: USEFUL VIEWS
-- Pre-built queries the React app will use frequently.
-- ============================================================

-- Motion A daily list: leads owned by Rus, ordered by priority
create or replace view motion_a_daily as
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
where l.owner = 'rus'
  and l.status not in ('won', 'lost', 'declined', 'blocked', 'parked')
order by priority_order, days_since_last_touch desc nulls last;

comment on view motion_a_daily is 'Rus''s daily working list. Ordered by status priority then by days silent (most urgent first).';


-- Motion B daily list: coordinator's outreach queue
-- Shows today's T1s due + any T2/T3s whose next_touch_date is today or past
create or replace view motion_b_daily as
select
  l.*,
  case
    when l.status = 'untouched'  then 1   -- Fresh T1s first
    when l.status = 't1-sent'    then 2   -- T2 follow-ups
    when l.status = 't2-sent'    then 3   -- T3 follow-ups
    else                              4
  end as queue_order
from leads l
where l.motion = 'B'
  and l.owner = 'coordinator'
  and l.status in ('untouched', 't1-sent', 't2-sent')
  and (
    l.status = 'untouched'                          -- Always show untouched
    or l.next_touch_date <= current_date            -- Or: follow-up is due today or overdue
  )
order by queue_order, l.next_touch_date asc nulls last;

comment on view motion_b_daily is 'Coordinator''s daily outreach queue. Shows untouched T1 leads plus any follow-ups due today or overdue.';


-- Scorecard: the key numbers for the top strip
create or replace view scorecard as
select
  (select count(*) from leads where status = 'won')                                     as paying_schools,
  (select count(*) from leads where motion = 'A' and status not in ('won','lost','declined','blocked','parked')) as motion_a_pipeline,
  (select count(*) from leads where motion = 'B' and status = 'untouched')              as motion_b_untouched,
  (select count(*) from leads where motion = 'B' and status != 'untouched')             as motion_b_touched,
  (select count(*) from sponsorship_slots where status = 'placed')                      as sponsor_slots_placed,
  (select count(*) from sponsorship_slots)                                               as sponsor_slots_total,
  (select count(*) from leads where status = 'reply-received' and owner = 'rus')        as pending_handovers,
  (select round(
    count(*) filter (where replied = true)::numeric /
    nullif(count(*), 0) * 100, 1
  ) from touch_log where sent_date >= current_date - interval '90 days')               as reply_rate_90d;

comment on view scorecard is 'Single-row view of the key numbers shown in the scorecard strip. The React app reads this once on load and subscribes to real-time updates.';


-- ============================================================
-- SECTION 7: HANDOVER FUNCTION
-- Called by the React app when the coordinator clicks
-- "Flag for Rus — reply received". Executes as a transaction:
-- updates the lead AND inserts the handover event atomically.
-- If either step fails, both roll back.
-- ============================================================

create or replace function handle_handover(
  p_lead_id       uuid,
  p_triggered_by  uuid,
  p_demo_date     timestamptz default null,
  p_notes         text default null
)
returns void as $$
declare
  v_lead leads%rowtype;
begin
  -- Get current lead state
  select * into v_lead from leads where id = p_lead_id for update;

  if not found then
    raise exception 'Lead % not found', p_lead_id;
  end if;

  -- Record the handover event (this INSERT triggers the webhook → Resend email)
  insert into handover_events (
    lead_id, from_owner, to_owner, from_motion, to_motion,
    from_status, to_status, triggered_by, demo_date, notes
  ) values (
    p_lead_id,
    v_lead.owner,         -- coordinator
    'rus',
    v_lead.motion,        -- B
    'A',
    v_lead.status,        -- t1-sent / t2-sent / t3-sent
    'reply-received',
    p_triggered_by,
    p_demo_date,
    p_notes
  );

  -- Update the lead
  update leads set
    owner           = 'rus',
    motion          = 'A',
    status          = 'reply-received',
    demo_date       = p_demo_date,
    demo_booked_by  = 'coordinator',
    last_reply_date = current_date,
    updated_at      = now()
  where id = p_lead_id;

end;
$$ language plpgsql security definer;

comment on function handle_handover is 'Atomic handover: updates the lead AND inserts a handover_events row in a single transaction. The handover_events INSERT triggers the Supabase webhook that calls the Resend Edge Function to email Rus.';


-- ============================================================
-- SECTION 8: SEED DATA — TEMPLATE STUBS
-- Placeholder templates for every P1-P6 × T1/T2/T3 combination.
-- Real copy to be pasted in from the template library document.
-- ============================================================

insert into templates (persona, touch_number, template_type, name, subject, body) values

-- P1: Established Music Programme
('P1', 'T1', 'intro', 'P1 T1 — Established Music Dept',
 'A quick thought on {{school_name}}''s music programme',
 'Hi {{first_name}},

I hope Term 3 is off to a good start. I came across {{school_name}}''s music programme — it looks like you''ve built something genuinely impressive.

We work with established music departments to give teachers back the time that currently goes into lesson prep and theory drilling — with a structured, curriculum-aligned platform that handles the heavy lifting.

I have a favour to ask — would you be open to a 20-minute call to see if it could be useful for your team? Happy to work around your timetable.

Best,
Rus Nerwich
The Ear Academy'),

('P1', 'T2', 'followup', 'P1 T2 — Follow-up',
 'Re: {{school_name}}''s music programme',
 'Hi {{first_name}},

Just a quick follow-up on my note from last week — I know the start of term is always busy.

Would a short call this week or next suit? Happy to fit around your timetable.

Best,
Rus Nerwich
The Ear Academy'),

('P1', 'T3', 'followup', 'P1 T3 — Final follow-up',
 'Last note — {{school_name}} music programme',
 'Hi {{first_name}},

I''ll keep this brief — one last note before I leave you in peace.

If the timing isn''t right at the moment, I completely understand. I''d just hate for {{school_name}}''s music team to miss something that might genuinely help them.

If you''d like to pick this up at any point, my details are below.

Best,
Rus Nerwich
The Ear Academy'),

-- P2: Overstretched Music Dept
('P2', 'T1', 'intro', 'P2 T1 — Overstretched Music Dept',
 'Giving {{school_name}}''s music teacher more time',
 'Hi {{first_name}},

I hope the start of Term 3 is going well. I wanted to reach out about something that might make a real difference for your music department.

We work with music teachers who are doing everything — the teaching, the prep, the administration — and we give them the infrastructure to make it sustainable. Curriculum-aligned content, theory drills, sight-reading, all structured and ready to go.

Would you be open to a 20-minute call to see if it could work for {{school_name}}? Happy to fit around your schedule.

Best,
Rus Nerwich
The Ear Academy'),

('P2', 'T2', 'followup', 'P2 T2 — Follow-up',
 'Re: {{school_name}} music department',
 'Hi {{first_name}},

Just following up on my note from last week. I know this time of term is always hectic.

Would a short call this week or next work? I can fit around your timetable.

Best,
Rus Nerwich
The Ear Academy'),

('P2', 'T3', 'followup', 'P2 T3 — Final follow-up',
 'Last note — {{school_name}}',
 'Hi {{first_name}},

One last note before I stop filling your inbox.

If the timing isn''t right, I completely understand — and I''d be happy to pick this up at a better point in the year. Just let me know.

Best,
Rus Nerwich
The Ear Academy'),

-- P3: Partial / Thin Offering
('P3', 'T1', 'intro', 'P3 T1 — Partial Music Offering',
 'Giving {{school_name}} consistent music — without a specialist',
 'Hi {{first_name}},

I hope Term 3 is off to a good start. I wanted to reach out about something that might be relevant for {{school_name}}.

A lot of schools at your stage offer music occasionally — but making it consistent without a specialist is the real challenge. The Ear Academy was built for exactly that: a curriculum-aligned programme that any teacher can deliver, with no music background required.

Would you be open to a quick 20-minute call to see if it could work for your school?

Best,
Rus Nerwich
The Ear Academy'),

('P3', 'T2', 'followup', 'P3 T2 — Follow-up',
 'Re: Music at {{school_name}}',
 'Hi {{first_name}},

Just a quick follow-up on my note from last week. I know the start of term is busy.

Would a short call this week or next suit?

Best,
Rus Nerwich
The Ear Academy'),

('P3', 'T3', 'followup', 'P3 T3 — Final follow-up',
 'Last note — music at {{school_name}}',
 'Hi {{first_name}},

One last note before I leave you in peace.

If the timing isn''t right at the moment, I''m happy to pick this up later in the year. Just reply whenever suits.

Best,
Rus Nerwich
The Ear Academy'),

-- P4: No Music, Values Enrichment
('P4', 'T1', 'intro', 'P4 T1 — No Music, Values Enrichment',
 'The next step for {{school_name}}''s arts offering',
 'Hi {{first_name}},

I hope Term 3 is going well. I''m reaching out from The Ear Academy — we work with schools that want to give their learners access to quality music education without the cost of hiring a specialist.

Our platform is curriculum-aligned, requires no specialist teacher to deliver, and gives every learner — regardless of background — access to music as part of their school day.

Would you be open to a 20-minute call to explore whether it could be the right next step for {{school_name}}?

Best,
Rus Nerwich
The Ear Academy'),

('P4', 'T2', 'followup', 'P4 T2 — Follow-up',
 'Re: Music education at {{school_name}}',
 'Hi {{first_name}},

Just following up on my note from last week. Happy to keep this brief — would a short call this week suit?

Best,
Rus Nerwich
The Ear Academy'),

('P4', 'T3', 'followup', 'P4 T3 — Final follow-up',
 'Last note — {{school_name}}',
 'Hi {{first_name}},

One last note before I stop. If the timing isn''t right, I''m happy to pick this up at any point — just reply whenever suits.

Best,
Rus Nerwich
The Ear Academy'),

-- P5: No Music, Budget-Constrained
('P5', 'T1', 'intro', 'P5 T1 — Budget-Constrained',
 'Music at {{school_name}} — made possible',
 'Hi {{first_name}},

I hope Term 3 is off to a good start. I''m reaching out from The Ear Academy — we work with schools that want to offer music to their learners but haven''t yet found an affordable way to do it.

Our platform is priced to replace the cost of a specialist teacher, not add to it — and it gives every learner access to a full music curriculum from day one.

Would you be open to a 20-minute call to see if we could make it work for {{school_name}}?

Best,
Rus Nerwich
The Ear Academy'),

('P5', 'T2', 'followup', 'P5 T2 — Follow-up',
 'Re: Music at {{school_name}}',
 'Hi {{first_name}},

Just a quick follow-up on my note from last week. Would a short call this week or next suit?

Best,
Rus Nerwich
The Ear Academy'),

('P5', 'T3', 'followup', 'P5 T3 — Final follow-up',
 'Last note — {{school_name}}',
 'Hi {{first_name}},

One final note before I leave you in peace. If the timing isn''t right at the moment, happy to reconnect later in the year — just reply whenever suits.

Best,
Rus Nerwich
The Ear Academy'),

-- P6: School Group
('P6', 'T1', 'intro', 'P6 T1 — School Group',
 'The same standard of music across every {{school_name}} campus',
 'Hi {{first_name}},

I hope Term 3 is going well. I''m reaching out from The Ear Academy — we work with school groups to deliver a consistent, curriculum-aligned music programme across multiple campuses from a single platform.

Every school in the group gets the same structured content, the same quality of delivery, and the same reporting — managed centrally with no specialist teacher required at each site.

Would you be open to a 20-minute call to explore what this could look like for {{school_name}}?

Best,
Rus Nerwich
The Ear Academy'),

('P6', 'T2', 'followup', 'P6 T2 — Follow-up',
 'Re: Music across {{school_name}} campuses',
 'Hi {{first_name}},

Just following up on my note from last week. Would a short call this week or next suit?

Best,
Rus Nerwich
The Ear Academy'),

('P6', 'T3', 'followup', 'P6 T3 — Final follow-up',
 'Last note — {{school_name}}',
 'Hi {{first_name}},

One final note before I leave you in peace. Happy to reconnect at any point — just reply whenever suits.

Best,
Rus Nerwich
The Ear Academy');


-- ============================================================
-- SCHEMA COMPLETE
-- Next step: deploy the Resend Edge Function (see 02_edge_function.ts)
-- Then: initialise the React app (see 03_claude_code_prompt.md)
-- ============================================================
