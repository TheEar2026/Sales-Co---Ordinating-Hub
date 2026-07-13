import type { LeadStatus } from '../../types'

const STATUS_STYLES: Record<LeadStatus, string> = {
  untouched: 'bg-gray-100 text-gray-600',
  't1-sent': 'bg-gold-light text-gold',
  't2-sent': 'bg-gold-light text-gold',
  't3-sent': 'bg-gold-light text-gold',
  'reply-received': 'bg-amber-light text-amber',
  'demo-booked': 'bg-amber-light text-amber',
  'demo-held': 'bg-amber-light text-amber',
  'proposal-sent': 'bg-amber-light text-amber',
  negotiation: 'bg-amber-light text-amber',
  close: 'bg-green-light text-green',
  won: 'bg-green-light text-green',
  lost: 'bg-red-light text-red',
  parked: 'bg-gray-100 text-gray-500',
  declined: 'bg-red-light text-red',
  blocked: 'bg-red-light text-red',
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  untouched: 'Untouched',
  't1-sent': 'T1 sent',
  't2-sent': 'T2 sent',
  't3-sent': 'T3 sent',
  'reply-received': 'Reply received',
  'demo-booked': 'Demo booked',
  'demo-held': 'Demo held',
  'proposal-sent': 'Proposal sent',
  negotiation: 'Negotiation',
  close: 'Close',
  won: 'Won',
  lost: 'Lost',
  parked: 'Parked',
  declined: 'Declined',
  blocked: 'Blocked',
}

export default function StatusChip({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
