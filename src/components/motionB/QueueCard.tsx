import type { MotionBDailyLead } from '../../types'
import Icon from '../shared/Icon'

interface QueueCardProps {
  lead: MotionBDailyLead
  selected: boolean
  done: boolean
  onClick: () => void
}

export default function QueueCard({ lead, selected, done, onClick }: QueueCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left transition-all ${
        done ? 'opacity-45' : ''
      } ${selected ? 'bg-gold-light' : 'bg-card hover:bg-soft'}`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          done ? 'border-green bg-green text-white' : 'border-line text-transparent'
        }`}
      >
        {done && <Icon name="check" size={14} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          {lead.needs_review && <Icon name="warning" size={12} filled className="shrink-0 text-amber" />}
          <span className="truncate text-body-sm font-bold text-ink">{lead.contact_name}</span>
        </div>
        <div className="truncate micro-label mt-0.5 text-muted">{lead.school_name}</div>
      </div>
      {lead.persona && (
        <span className="shrink-0 rounded bg-soft px-1.5 py-0.5 text-[10px] font-bold text-muted">
          {lead.persona}
        </span>
      )}
    </button>
  )
}
