import type { MotionADailyLead } from '../../types'
import LeadCard from './LeadCard'
import LoadingSpinner from '../shared/LoadingSpinner'

interface LeadListProps {
  leads: MotionADailyLead[]
  loading: boolean
  selectedId: string | null
  onSelect: (lead: MotionADailyLead) => void
}

export default function LeadList({ leads, loading, selectedId, onSelect }: LeadListProps) {
  return (
    <div className="flex w-[310px] shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Rus — daily priority list ({leads.length})
      </div>
      {loading ? (
        <LoadingSpinner label="Loading leads…" />
      ) : leads.length === 0 ? (
        <div className="px-3 py-8 text-center text-sm text-gray-400">No active leads.</div>
      ) : (
        leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            selected={lead.id === selectedId}
            onClick={() => onSelect(lead)}
          />
        ))
      )}
    </div>
  )
}
