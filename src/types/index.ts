export type OwnerType = 'rus' | 'coordinator'

export type MotionType = 'A' | 'B' | 'sponsorship'

export type LeadStatus =
  | 'untouched'
  | 't1-sent'
  | 't2-sent'
  | 't3-sent'
  | 'reply-received'
  | 'demo-booked'
  | 'demo-held'
  | 'proposal-sent'
  | 'negotiation'
  | 'close'
  | 'won'
  | 'lost'
  | 'parked'
  | 'declined'
  | 'blocked'

export type PersonaCode = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6'

export type TouchNumber = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8'

export type TemplateType =
  | 'intro'
  | 'followup'
  | 'post-demo'
  | 'proposal'
  | 'objection'
  | 'requalify'

export interface User {
  id: string
  email: string
  full_name: string
  role: OwnerType
  created_at: string
}

export interface Lead {
  id: string
  contact_name: string
  contact_email: string | null
  contact_role: string | null
  contact_phone: string | null
  school_name: string
  school_province: string | null
  school_type: string | null

  persona: PersonaCode | null
  motion: MotionType
  tier: string | null

  owner: OwnerType
  status: LeadStatus

  ac_deal_id: number | null
  ac_deal_value: number | null
  ac_deal_stage: string | null
  ac_deal_currency: string | null

  next_touch_date: string | null
  demo_date: string | null
  demo_booked_by: OwnerType | null

  touch_count: number
  last_touch_date: string | null
  last_reply_date: string | null
  first_reply_date: string | null

  notes: string | null
  next_action: string | null
  source: string | null
  source_motion: MotionType | null

  needs_review: boolean
  review_reason: string | null

  created_at: string
  updated_at: string
}

export interface MotionADailyLead extends Lead {
  days_since_last_touch: number | null
  priority_order: number
}

export interface MotionBDailyLead extends Lead {
  queue_order: number
}

export interface TouchLog {
  id: string
  lead_id: string
  touch_number: TouchNumber
  sent_by: OwnerType
  sent_date: string
  channel: string
  replied: boolean
  reply_date: string | null
  reply_summary: string | null
  template_id: string | null
  created_at: string
}

export interface Template {
  id: string
  persona: PersonaCode
  touch_number: TouchNumber
  template_type: TemplateType
  name: string
  subject: string
  body: string
  is_active: boolean
  version: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface HandoverEvent {
  id: string
  lead_id: string
  from_owner: OwnerType
  to_owner: OwnerType
  from_motion: MotionType
  to_motion: MotionType
  from_status: LeadStatus
  to_status: LeadStatus
  triggered_by: string | null
  demo_date: string | null
  notes: string | null
  notification_sent: boolean
  notification_sent_at: string | null
  created_at: string
}

export interface SponsorshipSlot {
  id: string
  slot_number: number
  sponsor_name: string | null
  status: string
  school_name: string | null
  contact_name: string | null
  contact_email: string | null
  lead_id: string | null
  identified_date: string | null
  contacted_date: string | null
  placed_date: string | null
  activated_date: string | null
  notes: string | null
  next_action: string | null
  next_action_date: string | null
  created_at: string
  updated_at: string
}

export interface Scorecard {
  paying_schools: number
  motion_a_pipeline: number
  motion_b_untouched: number
  motion_b_touched: number
  sponsor_slots_placed: number
  sponsor_slots_total: number
  pending_handovers: number
  reply_rate_90d: number | null
  needs_review_count: number
}
