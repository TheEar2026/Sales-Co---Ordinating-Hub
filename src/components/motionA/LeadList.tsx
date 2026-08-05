import { useMemo, useState } from 'react'
import type { LeadStatus, MotionADailyLead } from '../../types'
import LeadCard from './LeadCard'
import LoadingSpinner from '../shared/LoadingSpinner'
import Icon from '../shared/Icon'

interface LeadListProps {
  leads: MotionADailyLead[]
  loading: boolean
  selectedId: string | null
  onSelect: (lead: MotionADailyLead) => void
}

// Deal-stage statuses past initial outreach — a lead here has replied
// or progressed, so it's no longer tracked by touch cadence.
const ADVANCED_STATUSES: LeadStatus[] = [
  'reply-received',
  'demo-booked',
  'demo-held',
  'proposal-sent',
  'negotiation',
  'close',
]

type SegmentFilter = 'all' | 'due' | 'notContacted' | 'contacted' | 'active'

function segmentLeads(leads: MotionADailyLead[]) {
  const due = leads.filter((l) => l.needs_followup)
  const rest = leads.filter((l) => !l.needs_followup)
  const active = rest.filter((l) => ADVANCED_STATUSES.includes(l.status))
  const early = rest.filter((l) => !ADVANCED_STATUSES.includes(l.status))
  const notContacted = early.filter((l) => l.touch_count === 0)
  const contacted = early.filter((l) => l.touch_count > 0)
  return { due, notContacted, contacted, active }
}

function matchesSearch(lead: MotionADailyLead, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    lead.contact_name.toLowerCase().includes(q) ||
    lead.school_name.toLowerCase().includes(q) ||
    (lead.contact_email ?? '').toLowerCase().includes(q)
  )
}

export default function LeadList({ leads, loading, selectedId, onSelect }: LeadListProps) {
  const [segment, setSegment] = useState<SegmentFilter>('all')
  const [search, setSearch] = useState('')

  const { due, notContacted, contacted, active } = useMemo(() => segmentLeads(leads), [leads])

  const segmentLeadsList =
    segment === 'due'
      ? due
      : segment === 'notContacted'
        ? notContacted
        : segment === 'contacted'
          ? contacted
          : segment === 'active'
            ? active
            : leads

  const filteredLeads = useMemo(
    () => segmentLeadsList.filter((l) => matchesSearch(l, search)),
    [segmentLeadsList, search],
  )

  return (
    <aside className="flex w-[310px] shrink-0 flex-col overflow-y-auto border-r border-line bg-card">
      <header className="space-y-2 border-b border-line bg-soft px-3 py-2.5">
        <h2 className="micro-label text-ink">
          Rus — daily priority list ({filteredLeads.length} of {leads.length})
        </h2>
        <div className="relative">
          <Icon
            name="search"
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, school, email…"
            className="w-full rounded border border-line bg-card py-1.5 pl-8 pr-2 text-body-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-[11px] text-muted">
          <button
            onClick={() => setSegment('all')}
            className={segment === 'all' ? 'font-bold text-ink underline' : ''}
          >
            All
          </button>
          {due.length > 0 && (
            <button
              onClick={() => setSegment('due')}
              className={`text-amber ${segment === 'due' ? 'font-bold underline' : ''}`}
            >
              Due today: {due.length}
            </button>
          )}
          <button
            onClick={() => setSegment('notContacted')}
            className={segment === 'notContacted' ? 'font-bold text-ink underline' : ''}
          >
            Not yet contacted: {notContacted.length}
          </button>
          <button
            onClick={() => setSegment('contacted')}
            className={segment === 'contacted' ? 'font-bold text-ink underline' : ''}
          >
            Contacted: {contacted.length}
          </button>
          <button
            onClick={() => setSegment('active')}
            className={`text-green ${segment === 'active' ? 'font-bold underline' : ''}`}
          >
            Active pipeline: {active.length}
          </button>
        </div>
      </header>
      {loading ? (
        <LoadingSpinner label="Loading leads…" />
      ) : leads.length === 0 ? (
        <div className="px-3 py-8 text-center text-body-sm text-muted">No active leads.</div>
      ) : filteredLeads.length === 0 ? (
        <div className="px-3 py-8 text-center text-body-sm text-muted">No leads match.</div>
      ) : (
        filteredLeads.map((lead) => (
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
