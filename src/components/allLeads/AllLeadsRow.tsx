import type { Lead } from '../../types'
import StatusChip from '../shared/StatusChip'
import TierBadge from '../shared/TierBadge'

interface AllLeadsRowProps {
  lead: Lead
  selected: boolean
  onClick: () => void
}

export default function AllLeadsRow({ lead, selected, onClick }: AllLeadsRowProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col gap-1 border-b border-line px-3 py-2.5 text-left transition-colors ${
        selected ? 'bg-gold-light' : 'bg-card hover:bg-soft'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-body-sm font-bold text-ink">{lead.contact_name}</span>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${lead.owner === 'rus' ? 'bg-gold-mid' : 'bg-green'}`}
        />
      </div>
      <p className="truncate micro-label text-muted">{lead.school_name}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusChip status={lead.status} />
        <TierBadge tier={lead.tier} />
      </div>
    </button>
  )
}
