import { useMemo, useState } from 'react'
import { useAllLeads } from '../../hooks/useLeads'
import type { Lead, LeadStatus, OwnerType } from '../../types'
import AllLeadsRow from './AllLeadsRow'
import AllLeadsDetail from './AllLeadsDetail'
import LoadingSpinner from '../shared/LoadingSpinner'
import Icon from '../shared/Icon'

const STATUS_LABELS: Record<LeadStatus, string> = {
  untouched: 'Untouched',
  't1-sent': 'T1 sent',
  't2-sent': 'T2 sent',
  't3-sent': 'T3 sent',
  'reply-received': 'Reply received',
  'demo-booked': 'Demo booked',
  'demo-held': 'Demo held',
  'proposal-sent': 'Proposal sent',
  negotiation: 'Negotiation',
  close: 'Close',
  won: 'Won',
  lost: 'Lost',
  parked: 'Parked',
  declined: 'Declined',
  blocked: 'Blocked',
}

const ALL_STATUSES = Object.keys(STATUS_LABELS) as LeadStatus[]

function matchesSearch(lead: Lead, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    lead.contact_name.toLowerCase().includes(q) ||
    lead.school_name.toLowerCase().includes(q) ||
    (lead.contact_email ?? '').toLowerCase().includes(q)
  )
}

export default function AllLeadsView() {
  const { leads, loading, refetch } = useAllLeads()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [ownerFilter, setOwnerFilter] = useState<OwnerType | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      leads.filter(
        (l) =>
          matchesSearch(l, search) &&
          (statusFilter === 'all' || l.status === statusFilter) &&
          (ownerFilter === 'all' || l.owner === ownerFilter),
      ),
    [leads, search, statusFilter, ownerFilter],
  )

  // Look the selection up in the live list rather than holding a stale
  // copy, so edits and realtime updates show immediately.
  const selected = selectedId ? (leads.find((l) => l.id === selectedId) ?? null) : null

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="flex w-[340px] shrink-0 flex-col overflow-hidden border-r border-line bg-card">
        <header className="space-y-2 border-b border-line bg-soft px-3 py-2.5">
          <h2 className="micro-label text-ink">
            All leads ({filtered.length} of {leads.length})
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
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="flex-1 rounded border border-line bg-card px-2 py-1 text-[12px] text-ink"
            >
              <option value="all">All statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value as OwnerType | 'all')}
              className="flex-1 rounded border border-line bg-card px-2 py-1 text-[12px] text-ink"
            >
              <option value="all">Both owners</option>
              <option value="rus">Owner</option>
              <option value="coordinator">Coordinator</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSpinner label="Loading leads…" />
          ) : filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-body-sm text-muted">No leads match.</div>
          ) : (
            filtered.map((lead) => (
              <AllLeadsRow
                key={lead.id}
                lead={lead}
                selected={lead.id === selectedId}
                onClick={() => setSelectedId(lead.id)}
              />
            ))
          )}
        </div>
      </aside>

      {selected ? (
        <AllLeadsDetail lead={selected} onUpdated={refetch} />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-soft text-body-md text-muted">
          Select a lead to see details.
        </div>
      )}
    </div>
  )
}
