// Seed data for demo mode (VITE_DEMO_MODE=true). Never used in production.
import type {
  HandoverEvent,
  Lead,
  SponsorshipSlot,
  Template,
  TouchLog,
  User,
} from '../types'

export const DEMO_PASSWORD = 'demo'

export const mockUsers: User[] = [
  {
    id: 'user-rus',
    email: 'rus@the-ear.com',
    full_name: 'Rus Nerwich',
    role: 'rus',
    created_at: '2026-06-30T08:00:00Z',
  },
  {
    id: 'user-coordinator',
    email: 'coordinator@the-ear.com',
    full_name: 'Sales Coordinator',
    role: 'coordinator',
    created_at: '2026-06-30T08:00:00Z',
  },
]

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const today = daysAgo(0)

let leadSeq = 0
function lead(partial: Partial<Lead> & Pick<Lead, 'contact_name' | 'school_name'>): Lead {
  leadSeq += 1
  return {
    id: `lead-${String(leadSeq).padStart(3, '0')}`,
    contact_email: null,
    contact_role: null,
    school_province: 'Western Cape',
    school_type: 'Independent prep',
    persona: null,
    motion: 'B',
    tier: null,
    owner: 'coordinator',
    status: 'untouched',
    ac_deal_id: null,
    ac_deal_value: null,
    ac_deal_stage: null,
    ac_deal_currency: null,
    needs_review: false,
    review_reason: null,
    next_touch_date: null,
    demo_date: null,
    demo_booked_by: null,
    touch_count: 0,
    last_touch_date: null,
    last_reply_date: null,
    first_reply_date: null,
    notes: null,
    next_action: null,
    source: 'sprint-q2',
    source_motion: 'B',
    created_at: '2026-06-30T08:00:00Z',
    updated_at: '2026-06-30T08:00:00Z',
    ...partial,
  }
}

export const mockLeads: Lead[] = [
  // ---- Motion A: Rus's pipeline ----
  lead({
    contact_name: 'Naledi Khumalo',
    contact_email: 'nkhumalo@stmarksprep.co.za',
    contact_role: 'Principal',
    school_name: "St Mark's Preparatory",
    motion: 'A',
    owner: 'rus',
    tier: 'CLOSE',
    status: 'close',
    ac_deal_value: 84000,
    ac_deal_stage: 'Agreed',
    touch_count: 9,
    last_touch_date: daysAgo(3),
    last_reply_date: daysAgo(4),
    notes: `[${daysAgo(4)}] Verbal yes from SLT. Waiting on signed SLA from bursar.`,
    next_action: 'Chase bursar for signed SLA — promised by Friday.',
  }),
  lead({
    contact_name: 'Pieter du Toit',
    contact_email: 'pdutoit@bergvliethigh.org.za',
    contact_role: 'Deputy Head: Academics',
    school_name: 'Bergvliet High School',
    motion: 'A',
    owner: 'rus',
    tier: 'CLOSE',
    status: 'negotiation',
    ac_deal_value: 62000,
    ac_deal_stage: 'Negotiation',
    touch_count: 7,
    last_touch_date: daysAgo(8),
    notes: `[${daysAgo(8)}] Asked for 3-year pricing. Sent revised Xero quote.`,
    next_action: 'Follow up on revised quote — silence for over a week.',
  }),
  lead({
    contact_name: 'Fatima Adams',
    contact_email: 'f.adams@oakridgecollege.co.za',
    contact_role: 'Head of Music',
    school_name: 'Oakridge College',
    motion: 'A',
    owner: 'rus',
    tier: 'HOT',
    status: 'demo-booked',
    ac_deal_value: 45000,
    ac_deal_stage: 'Demo/Pilot',
    demo_date: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    touch_count: 4,
    last_touch_date: daysAgo(2),
    notes: `[${daysAgo(2)}] Demo confirmed for Wednesday 10:00. Wants theory-drilling focus.`,
    next_action: 'Prep demo — lead with Grade 8 theory module.',
  }),
  lead({
    contact_name: 'Sipho Ndlovu',
    contact_email: 'sndlovu@meadowlands.org.za',
    contact_role: 'Principal',
    school_name: 'Meadowlands Secondary',
    motion: 'A',
    owner: 'rus',
    tier: 'HOT',
    status: 'proposal-sent',
    ac_deal_value: 38000,
    ac_deal_stage: 'Demo/Pilot',
    touch_count: 6,
    last_touch_date: daysAgo(12),
    notes: `[${daysAgo(12)}] SLT proposal sent after strong demo. Budget meeting end of month.`,
    next_action: 'Check in after their budget meeting.',
  }),
  lead({
    contact_name: 'Annelize Botha',
    contact_email: 'abotha@karoohigh.co.za',
    contact_role: 'HOD Arts & Culture',
    school_name: 'Karoo High School',
    motion: 'A',
    owner: 'rus',
    tier: 'ACTIVE',
    status: 'demo-held',
    ac_deal_value: 30000,
    touch_count: 5,
    last_touch_date: daysAgo(65),
    notes: `[${daysAgo(65)}] Demo went fine but budget frozen until new financial year.`,
    next_action: 'Re-qualify — over 60 days silent.',
  }),
  // Won leads → paying schools on the scorecard
  lead({
    contact_name: 'Baatjies',
    school_name: 'Hillcrest Primary School',
    motion: 'A',
    owner: 'rus',
    tier: 'CLOSE',
    status: 'won',
    ac_deal_value: 52000,
    touch_count: 11,
    last_touch_date: daysAgo(30),
  }),
  lead({
    contact_name: 'Grace Mokoena',
    school_name: 'Rosebank Primary',
    motion: 'A',
    owner: 'rus',
    status: 'won',
    ac_deal_value: 41000,
    touch_count: 8,
    last_touch_date: daysAgo(20),
  }),
  lead({
    contact_name: 'Johan Venter',
    school_name: 'Paarl Gimnasium',
    motion: 'A',
    owner: 'rus',
    status: 'won',
    ac_deal_value: 58000,
    touch_count: 10,
    last_touch_date: daysAgo(15),
  }),

  // ---- Motion B: coordinator queue — T1s (untouched) ----
  lead({
    contact_name: 'Thandi Mahlangu',
    contact_email: 'tmahlangu@sunnysideprimary.co.za',
    contact_role: 'Principal',
    school_name: 'Sunnyside Primary',
    persona: 'P4',
    notes: 'No music offering currently. Strong arts-and-culture positioning on website.',
  }),
  lead({
    contact_name: 'Kobus Steyn',
    contact_email: 'ksteyn@wineland.co.za',
    contact_role: 'Head of Academics',
    school_name: 'Winelands College',
    persona: 'P2',
    notes: 'One overstretched music teacher covering Gr 1–7. Choir strong, theory weak.',
  }),
  lead({
    contact_name: 'Zanele Dube',
    contact_email: 'zdube@horizonacademy.org.za',
    contact_role: 'Principal',
    school_name: 'Horizon Academy',
    persona: 'P3',
    notes: 'Occasional music via external tutor — inconsistent. Fee-paying, mid-tier.',
  }),
  // ---- Motion B: T2 follow-ups due today ----
  lead({
    contact_name: 'Marius Coetzee',
    contact_email: 'mcoetzee@stellenpark.co.za',
    contact_role: 'Deputy Principal',
    school_name: 'Stellenpark Primary',
    persona: 'P2',
    status: 't1-sent',
    touch_count: 1,
    last_touch_date: daysAgo(7),
    next_touch_date: today,
    notes: 'T1 sent last week — no reply. Music teacher on maternity cover.',
  }),
  lead({
    contact_name: 'Lerato Molefe',
    contact_email: 'lmolefe@kingsway.org.za',
    contact_role: 'Head of Music',
    school_name: 'Kingsway College',
    persona: 'P1',
    status: 't1-sent',
    touch_count: 1,
    last_touch_date: daysAgo(8),
    next_touch_date: daysAgo(1),
    notes: 'Established music dept, 3 staff. T1 opened twice per tracker, no reply.',
  }),
  // ---- Motion B: T3 follow-up due today ----
  lead({
    contact_name: 'Susan Pretorius',
    contact_email: 'spretorius@midlandsprep.co.za',
    contact_role: 'Principal',
    school_name: 'Midlands Preparatory',
    persona: 'P5',
    status: 't2-sent',
    touch_count: 2,
    last_touch_date: daysAgo(6),
    next_touch_date: today,
    notes: 'Budget-constrained school. Two touches, no reply yet.',
  }),
  // Touched-but-not-due leads to make pool numbers realistic
  lead({
    contact_name: 'David Nkosi',
    school_name: 'Riverside Academy',
    persona: 'P4',
    status: 't1-sent',
    touch_count: 1,
    last_touch_date: daysAgo(2),
    next_touch_date: daysAgo(-4),
  }),
  lead({
    contact_name: 'Elmarie van Wyk',
    school_name: 'Boland Primary',
    persona: 'P3',
    status: 't2-sent',
    touch_count: 2,
    last_touch_date: daysAgo(3),
    next_touch_date: daysAgo(-3),
  }),
  // Auto-detected by the Outlook reply scan — status flipped straight
  // to reply-received while still owned by the coordinator, awaiting
  // her handover confirmation.
  lead({
    contact_name: 'Naledi Dube',
    school_name: 'Fernwood High',
    persona: 'P2',
    status: 'reply-received',
    touch_count: 2,
    last_touch_date: daysAgo(1),
    last_reply_date: daysAgo(0),
    source: 'manual',
  }),
  // Auto-created by the AC deal-sync webhook — no matching ac_deal_id
  // was found in Supabase, so it landed here flagged for review.
  lead({
    contact_name: 'Unknown contact (AC deal #1822)',
    school_name: 'Greenway College',
    motion: 'A',
    owner: 'rus',
    status: 'negotiation',
    tier: 'ACTIVE',
    ac_deal_id: 1822,
    ac_deal_value: 47500,
    ac_deal_currency: 'ZAR',
    needs_review: true,
    review_reason:
      "Auto-created from AC deal #1822 — no matching ac_deal_id found in Supabase. Verify contact and school details.",
    source: 'activecampaign',
  }),
]

let touchSeq = 0
function touch(partial: Partial<TouchLog> & Pick<TouchLog, 'lead_id' | 'touch_number' | 'sent_by' | 'sent_date'>): TouchLog {
  touchSeq += 1
  return {
    id: `touch-${String(touchSeq).padStart(3, '0')}`,
    channel: 'email',
    replied: false,
    reply_date: null,
    reply_summary: null,
    template_id: null,
    created_at: new Date().toISOString(),
    ...partial,
  }
}

export const mockTouchLog: TouchLog[] = [
  touch({ lead_id: 'lead-001', touch_number: 'T8', sent_by: 'rus', sent_date: daysAgo(3), channel: 'call' }),
  touch({
    lead_id: 'lead-001',
    touch_number: 'T7',
    sent_by: 'rus',
    sent_date: daysAgo(10),
    replied: true,
    reply_date: daysAgo(9),
    reply_summary: 'SLT confirmed verbal agreement.',
  }),
  touch({ lead_id: 'lead-002', touch_number: 'T7', sent_by: 'rus', sent_date: daysAgo(8) }),
  touch({
    lead_id: 'lead-003',
    touch_number: 'T4',
    sent_by: 'rus',
    sent_date: daysAgo(2),
    replied: true,
    reply_date: daysAgo(2),
    reply_summary: 'Confirmed demo slot for Wednesday.',
  }),
  touch({ lead_id: 'lead-012', touch_number: 'T1', sent_by: 'coordinator', sent_date: daysAgo(7) }),
  touch({ lead_id: 'lead-013', touch_number: 'T1', sent_by: 'coordinator', sent_date: daysAgo(8) }),
  touch({ lead_id: 'lead-014', touch_number: 'T1', sent_by: 'coordinator', sent_date: daysAgo(13) }),
  touch({ lead_id: 'lead-014', touch_number: 'T2', sent_by: 'coordinator', sent_date: daysAgo(6) }),
]

let templateSeq = 0
function template(
  persona: Template['persona'],
  touch_number: Template['touch_number'],
  template_type: Template['template_type'],
  name: string,
  subject: string,
  body: string,
): Template {
  templateSeq += 1
  return {
    id: `template-${String(templateSeq).padStart(3, '0')}`,
    persona,
    touch_number,
    template_type,
    name,
    subject,
    body,
    is_active: true,
    version: 1,
    created_by: 'user-rus',
    updated_by: null,
    created_at: '2026-06-30T08:00:00Z',
    updated_at: '2026-06-30T08:00:00Z',
  }
}

const SIGNATURE = 'Best,\nRus Nerwich\nThe Ear Academy'

export const mockTemplates: Template[] = [
  template(
    'P1', 'T1', 'intro', 'P1 T1 — Established Music Dept',
    "A quick thought on {{school_name}}'s music programme",
    `Hi {{first_name}},\n\nI hope Term 3 is off to a good start. I came across {{school_name}}'s music programme — it looks like you've built something genuinely impressive.\n\nWe work with established music departments to give teachers back the time that currently goes into lesson prep and theory drilling.\n\nWould you be open to a 20-minute call to see if it could be useful for your team?\n\n${SIGNATURE}`,
  ),
  template(
    'P1', 'T2', 'followup', 'P1 T2 — Follow-up',
    "Re: {{school_name}}'s music programme",
    `Hi {{first_name}},\n\nJust a quick follow-up on my note from last week — I know the start of term is always busy.\n\nWould a short call this week or next suit?\n\n${SIGNATURE}`,
  ),
  template(
    'P1', 'T3', 'followup', 'P1 T3 — Final follow-up',
    'Last note — {{school_name}} music programme',
    `Hi {{first_name}},\n\nI'll keep this brief — one last note before I leave you in peace.\n\nIf the timing isn't right at the moment, I completely understand.\n\n${SIGNATURE}`,
  ),
  template(
    'P2', 'T1', 'intro', 'P2 T1 — Overstretched Music Dept',
    "Giving {{school_name}}'s music teacher more time",
    `Hi {{first_name}},\n\nWe work with music teachers who are doing everything — the teaching, the prep, the administration — and give them the infrastructure to make it sustainable.\n\nWould you be open to a 20-minute call to see if it could work for {{school_name}}?\n\n${SIGNATURE}`,
  ),
  template(
    'P2', 'T2', 'followup', 'P2 T2 — Follow-up',
    'Re: {{school_name}} music department',
    `Hi {{first_name}},\n\nJust following up on my note from last week. I know this time of term is always hectic.\n\nWould a short call this week or next work?\n\n${SIGNATURE}`,
  ),
  template(
    'P2', 'T3', 'followup', 'P2 T3 — Final follow-up',
    'Last note — {{school_name}}',
    `Hi {{first_name}},\n\nOne last note before I stop filling your inbox.\n\nIf the timing isn't right, I completely understand.\n\n${SIGNATURE}`,
  ),
  template(
    'P3', 'T1', 'intro', 'P3 T1 — Partial Music Offering',
    'Giving {{school_name}} consistent music — without a specialist',
    `Hi {{first_name}},\n\nA lot of schools at your stage offer music occasionally — but making it consistent without a specialist is the real challenge. The Ear Academy was built for exactly that.\n\nWould you be open to a quick 20-minute call?\n\n${SIGNATURE}`,
  ),
  template(
    'P3', 'T2', 'followup', 'P3 T2 — Follow-up',
    'Re: Music at {{school_name}}',
    `Hi {{first_name}},\n\nJust a quick follow-up on my note from last week.\n\nWould a short call this week or next suit?\n\n${SIGNATURE}`,
  ),
  template(
    'P3', 'T3', 'followup', 'P3 T3 — Final follow-up',
    'Last note — music at {{school_name}}',
    `Hi {{first_name}},\n\nOne last note before I leave you in peace.\n\nHappy to pick this up later in the year — just reply whenever suits.\n\n${SIGNATURE}`,
  ),
  template(
    'P4', 'T1', 'intro', 'P4 T1 — No Music, Values Enrichment',
    "The next step for {{school_name}}'s arts offering",
    `Hi {{first_name}},\n\nWe work with schools that want to give their learners access to quality music education without the cost of hiring a specialist.\n\nWould you be open to a 20-minute call to explore whether it could be the right next step for {{school_name}}?\n\n${SIGNATURE}`,
  ),
  template(
    'P4', 'T2', 'followup', 'P4 T2 — Follow-up',
    'Re: Music education at {{school_name}}',
    `Hi {{first_name}},\n\nJust following up on my note from last week. Would a short call this week suit?\n\n${SIGNATURE}`,
  ),
  template(
    'P4', 'T3', 'followup', 'P4 T3 — Final follow-up',
    'Last note — {{school_name}}',
    `Hi {{first_name}},\n\nOne last note before I stop. Happy to pick this up at any point — just reply whenever suits.\n\n${SIGNATURE}`,
  ),
  template(
    'P5', 'T1', 'intro', 'P5 T1 — Budget-Constrained',
    'Music at {{school_name}} — made possible',
    `Hi {{first_name}},\n\nWe work with schools that want to offer music to their learners but haven't yet found an affordable way to do it.\n\nWould you be open to a 20-minute call to see if we could make it work for {{school_name}}?\n\n${SIGNATURE}`,
  ),
  template(
    'P5', 'T2', 'followup', 'P5 T2 — Follow-up',
    'Re: Music at {{school_name}}',
    `Hi {{first_name}},\n\nJust a quick follow-up on my note from last week. Would a short call this week or next suit?\n\n${SIGNATURE}`,
  ),
  template(
    'P5', 'T3', 'followup', 'P5 T3 — Final follow-up',
    'Last note — {{school_name}}',
    `Hi {{first_name}},\n\nOne final note before I leave you in peace. Happy to reconnect later in the year.\n\n${SIGNATURE}`,
  ),
  template(
    'P6', 'T1', 'intro', 'P6 T1 — School Group',
    'The same standard of music across every {{school_name}} campus',
    `Hi {{first_name}},\n\nWe work with school groups to deliver a consistent, curriculum-aligned music programme across multiple campuses from a single platform.\n\nWould you be open to a 20-minute call?\n\n${SIGNATURE}`,
  ),
]

export const mockHandoverEvents: HandoverEvent[] = []

export const mockSponsorshipSlots: SponsorshipSlot[] = Array.from({ length: 12 }, (_, i) => ({
  id: `slot-${i + 1}`,
  slot_number: i + 1,
  sponsor_name: null,
  status: i === 0 ? 'placed' : i === 1 ? 'placed' : i === 2 ? 'contacted' : 'unplaced',
  school_name: i === 0 ? 'Hillcrest Primary School' : null,
  contact_name: i === 0 ? 'Baatjies' : null,
  contact_email: null,
  lead_id: null,
  identified_date: null,
  contacted_date: null,
  placed_date: i === 0 ? '2026-06-02' : i === 1 ? '2026-07-01' : null,
  activated_date: null,
  notes: null,
  next_action: null,
  next_action_date: null,
  created_at: '2026-06-30T08:00:00Z',
  updated_at: '2026-06-30T08:00:00Z',
}))
