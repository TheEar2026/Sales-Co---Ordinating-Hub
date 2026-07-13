import type { MotionADailyLead } from '../../types'
import TierBadge from '../shared/TierBadge'

function formatZAR(value: number | null): string {
  if (!value) return ''
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value)
}

function stripeColor(lead: MotionADailyLead): string {
  const daysSilent = lead.days_since_last_touch ?? 0
  if (lead.tier === 'CLOSE') return 'bg-green'
  if (lead.tier === 'HOT' || lead.status === 'negotiation') return 'bg-amber'
  if (daysSilent > 60) return 'bg-red'
  return 'bg-transparent'
}

function silentColor(lead: MotionADailyLead): string {
  const d = lead.days_since_last_touch ?? 0
  if (d > 60) return 'text-red'
  if (d > 14) return 'text-amber'
  return 'text-muted'
}

interface LeadCardProps {
  lead: MotionADailyLead
  selected: boolean
  onClick: () => void
}

export default function LeadCard({ lead, selected, onClick }: LeadCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex w-full gap-3 border-b border-line px-3 py-3 text-left transition-colors ${
        selected ? 'bg-gold-light' : 'bg-card hover:bg-soft'
      }`}
    >
      <span className={`absolute bottom-0 left-0 top-0 w-1 ${stripeColor(lead)}`} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className="truncate text-[14px] font-bold text-ink">{lead.contact_name}</span>
          <TierBadge tier={lead.tier} />
        </div>
        <p className="micro-label mb-2 truncate text-muted">{lead.school_name}</p>
        <div className="flex items-center justify-between">
          <span className={`font-mono text-[13px] ${silentColor(lead)}`}>
            {lead.days_since_last_touch != null ? `${lead.days_since_last_touch}d silent` : 'no touch'}
          </span>
          {lead.ac_deal_value != null && (
            <span className="text-body-sm font-bold text-ink">{formatZAR(lead.ac_deal_value)}</span>
          )}
        </div>
      </div>
    </button>
  )
}
