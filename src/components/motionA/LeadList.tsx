import { useState } from 'react'
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

// Deal-stage statuses past initial outreach — a lead here has replied
// or progressed, so it's no longer tracked by touch cadence in either
// view.
const ADVANCED_STATUSES: LeadStatus[] = [
  'reply-received',
  'demo-booked',
  'demo-held',
  'proposal-sent',
  'negotiation',
  'close',
]

// Deal-stage view: where is this lead in the sales process.
function buildStageSections(leads: MotionADailyLead[]): Section[] {
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

// Touch-stage view: how many times have I reached out — mirrors
// Motion B's T1/T2/T3... sections (each split into due-today vs
// scheduled), using touch_count instead of a literal status enum
// since Motion A has none. Capped at T8, same as DetailFooter.tsx's
// own nextTouchNumber() helper.
function touchLevelForCount(touchCount: number): number {
  return Math.min(Math.max(touchCount + 1, 1), 8)
}

function buildTouchSections(leads: MotionADailyLead[]): Section[] {
  const active = leads.filter((l) => ADVANCED_STATUSES.includes(l.status))
  const early = leads.filter((l) => !ADVANCED_STATUSES.includes(l.status))
  const notContacted = early.filter((l) => l.touch_count === 0)

  const sections: Section[] = [
    { key: 'active', title: 'Active pipeline — not touch-tracked', dividerClass: 'bg-green/10 text-green', leads: active },
    { key: 't1', title: 'T1 — not yet contacted', dividerClass: 'bg-chrome text-white', leads: notContacted },
  ]

  for (let n = 2; n <= 8; n++) {
    const bucket = early.filter((l) => touchLevelForCount(l.touch_count) === n)
    const due = bucket.filter((l) => l.needs_followup)
    const scheduled = bucket.filter((l) => !l.needs_followup)
    sections.push(
      { key: `t${n}-due`, title: `T${n} — send today`, dividerClass: 'bg-amber-light text-amber', leads: due },
      { key: `t${n}-scheduled`, title: `T${n} — scheduled`, dividerClass: 'bg-soft text-muted', leads: scheduled },
    )
  }

  return sections
}

type ViewMode = 'stage' | 'touch'

export default function LeadList({ leads, loading, selectedId, onSelect }: LeadListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('stage')
  const sections = viewMode === 'stage' ? buildStageSections(leads) : buildTouchSections(leads)

  return (
    <aside className="flex w-[310px] shrink-0 flex-col overflow-y-auto border-r border-line bg-card">
      <header className="border-b border-line bg-soft px-3 py-2.5">
        <h2 className="micro-label text-ink">Rus — daily priority list ({leads.length})</h2>
        <div className="mt-2 flex gap-3 font-mono text-[12px] text-muted">
          <button
            onClick={() => setViewMode('stage')}
            className={viewMode === 'stage' ? 'font-bold text-ink underline' : ''}
          >
            By deal stage
          </button>
          <button
            onClick={() => setViewMode('touch')}
            className={viewMode === 'touch' ? 'font-bold text-ink underline' : ''}
          >
            By touch stage
          </button>
        </div>
      </header>
      {loading ? (
        <LoadingSpinner label="Loading leads…" />
      ) : leads.length === 0 ? (
        <div className="px-3 py-8 text-center text-body-sm text-muted">No active leads.</div>
      ) : (
        sections.map((section) =>
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
