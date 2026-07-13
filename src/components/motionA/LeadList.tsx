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
    <aside className="flex w-[310px] shrink-0 flex-col overflow-y-auto border-r border-border bg-white">
      <header className="border-b border-border bg-surface px-3 py-2.5">
        <h2 className="micro-label text-navy">Rus — daily priority list ({leads.length})</h2>
      </header>
      {loading ? (
        <LoadingSpinner label="Loading leads…" />
      ) : leads.length === 0 ? (
        <div className="px-3 py-8 text-center text-body-sm text-text-muted">No active leads.</div>
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
    </aside>
  )
}
