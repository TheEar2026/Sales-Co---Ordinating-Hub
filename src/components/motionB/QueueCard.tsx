import type { MotionBDailyLead } from '../../types'

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
      className={`flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2.5 text-left transition-opacity ${
        done ? 'opacity-45' : ''
      } ${selected ? 'bg-gold-light' : 'bg-white hover:bg-gray-50'}`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
          done ? 'border-green bg-green text-white' : 'border-gray-300 text-transparent'
        }`}
      >
        ✓
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-navy">{lead.contact_name}</div>
        <div className="truncate text-xs text-gray-500">{lead.school_name}</div>
      </div>
      {lead.persona && (
        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
          {lead.persona}
        </span>
      )}
    </button>
  )
}
