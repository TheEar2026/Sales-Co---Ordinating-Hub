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
      className={`flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-all ${
        done ? 'opacity-45' : ''
      } ${selected ? 'bg-gold-light' : 'bg-white hover:bg-surface'}`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          done ? 'border-green bg-green text-white' : 'border-gray-300 text-transparent'
        }`}
      >
        {done && <Icon name="check" size={14} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-body-sm font-bold text-navy">{lead.contact_name}</div>
        <div className="truncate micro-label mt-0.5 text-text-muted">{lead.school_name}</div>
      </div>
      {lead.persona && (
        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-text-muted">
          {lead.persona}
        </span>
      )}
    </button>
  )
}
