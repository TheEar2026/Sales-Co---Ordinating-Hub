import type { LeadStatus, MotionADailyLead } from '../../types'
import LeadCard from './LeadCard'
import LoadingSpinner from '../shared/LoadingSpinner'

interface LeadListProps {
  leads: MotionADailyLead[]
  loading: boolean
  selectedId: string | null
  onSelect: (lead: MotionADailyLead) => void
}

interface Section {
  key: string
  title: string
  dividerClass: string
  leads: MotionADailyLead[]
}

// Deal-stage statuses past initial outreach — Motion A has no literal
// T1/T2/T3 touch-sequence status like Motion B, so grouping uses the
// already-computed needs_followup/status/touch_count fields instead of
// inventing a new model.
const ADVANCED_STATUSES: LeadStatus[] = [
  'reply-received',
  'demo-booked',
  'demo-held',
  'proposal-sent',
  'negotiation',
  'close',
]

function buildSections(leads: MotionADailyLead[]): Section[] {
  const followup = leads.filter((l) => l.needs_followup)
  const rest = leads.filter((l) => !l.needs_followup)
  const active = rest.filter((l) => ADVANCED_STATUSES.includes(l.status))
  const early = rest.filter((l) => !ADVANCED_STATUSES.includes(l.status))
  const notContacted = early.filter((l) => l.touch_count === 0)
  const contacted = early.filter((l) => l.touch_count > 0)

  return [
    { key: 'followup', title: 'Follow-up due', dividerClass: 'bg-amber-light text-amber', leads: followup },
    { key: 'active', title: 'Active pipeline', dividerClass: 'bg-green/10 text-green', leads: active },
    { key: 'not-contacted', title: 'Not yet contacted', dividerClass: 'bg-chrome text-white', leads: notContacted },
    { key: 'contacted', title: 'Contacted — awaiting reply', dividerClass: 'bg-soft text-muted', leads: contacted },
  ]
}

export default function LeadList({ leads, loading, selectedId, onSelect }: LeadListProps) {
  return (
    <aside className="flex w-[310px] shrink-0 flex-col overflow-y-auto border-r border-line bg-card">
      <header className="border-b border-line bg-soft px-3 py-2.5">
        <h2 className="micro-label text-ink">Rus — daily priority list ({leads.length})</h2>
      </header>
      {loading ? (
        <LoadingSpinner label="Loading leads…" />
      ) : leads.length === 0 ? (
        <div className="px-3 py-8 text-center text-body-sm text-muted">No active leads.</div>
      ) : (
        buildSections(leads).map((section) =>
          section.leads.length > 0 ? (
            <div key={section.key}>
              <div className={`micro-label px-3 py-2 ${section.dividerClass}`}>
                {section.title} ({section.leads.length})
              </div>
              {section.leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  selected={lead.id === selectedId}
                  onClick={() => onSelect(lead)}
                />
              ))}
            </div>
          ) : null,
        )
      )}
    </aside>
  )
}
