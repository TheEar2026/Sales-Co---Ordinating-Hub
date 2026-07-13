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

function borderColor(lead: MotionADailyLead): string {
  const daysSilent = lead.days_since_last_touch ?? 0
  if (lead.tier === 'CLOSE') return 'border-l-green'
  if (lead.tier === 'HOT' || lead.status === 'negotiation') return 'border-l-amber'
  if (daysSilent > 60) return 'border-l-red'
  return 'border-l-transparent'
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
      className={`w-full border-l-4 border-b border-b-gray-100 px-3 py-3 text-left transition-colors ${borderColor(
        lead,
      )} ${selected ? 'bg-gold-light border-l-gold' : 'bg-white hover:bg-gray-50'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-navy">{lead.contact_name}</span>
        <TierBadge tier={lead.tier} />
      </div>
      <div className="mt-0.5 truncate text-xs text-gray-500">{lead.school_name}</div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
        <span>
          {lead.days_since_last_touch != null ? `${lead.days_since_last_touch}d silent` : 'No touch yet'}
        </span>
        {lead.ac_deal_value != null && (
          <span className="font-medium text-gray-600">{formatZAR(lead.ac_deal_value)}</span>
        )}
      </div>
    </button>
  )
}
