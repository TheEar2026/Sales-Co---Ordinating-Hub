import { useEffect, useRef, useState } from 'react'
import { VariableSizeList, type ListChildComponentProps } from 'react-window'
import { AutoSizer } from 'react-virtualized-auto-sizer'
import type { MotionBDailyLead } from '../../types'
import { useScorecard } from '../../hooks/useScorecard'
import QueueCard from './QueueCard'
import LoadingSpinner from '../shared/LoadingSpinner'
import Icon from '../shared/Icon'

const HEADER_HEIGHT = 32
const CARD_HEIGHT = 62

interface OutreachQueueProps {
  leads: MotionBDailyLead[]
  loading: boolean
  selectedId: string | null
  doneIds: Set<string>
  onSelect: (lead: MotionBDailyLead) => void
}

interface Section {
  key: string
  title: string
  dividerClass: string
  leads: MotionBDailyLead[]
}

type FlatRow = { type: 'header'; section: Section } | { type: 'lead'; lead: MotionBDailyLead }

export default function OutreachQueue({ leads, loading, selectedId, doneIds, onSelect }: OutreachQueueProps) {
  const { scorecard } = useScorecard()
  const [isasaOnly, setIsasaOnly] = useState(false)

  const replied = leads.filter((l) => l.status === 'reply-received')
  const t1s = leads.filter((l) => l.status === 'untouched' && (!isasaOnly || l.is_isasa))
  const t2s = leads.filter((l) => l.status === 't1-sent')
  const t3s = leads.filter((l) => l.status === 't2-sent')

  const sections: Section[] = [
    { key: 'replied', title: 'Replied — confirm handover', dividerClass: 'bg-green/10 text-green', leads: replied },
    { key: 't1', title: 'T1s — first touch today', dividerClass: 'bg-chrome text-white', leads: t1s },
    { key: 't2', title: 'T2 follow-ups due today', dividerClass: 'bg-amber-light text-amber', leads: t2s },
    { key: 't3', title: 'T3 follow-ups due today', dividerClass: 'bg-soft text-muted', leads: t3s },
  ]

  const touched = scorecard?.motion_b_touched ?? 0
  const totalPool = touched + (scorecard?.motion_b_untouched ?? 0)
  const poolPct = totalPool > 0 ? Math.min(100, (touched / totalPool) * 100) : 0

  const rows: FlatRow[] = sections.flatMap((section) =>
    section.leads.length > 0
      ? [{ type: 'header' as const, section }, ...section.leads.map((lead) => ({ type: 'lead' as const, lead }))]
      : [],
  )

  // VariableSizeList caches computed row offsets by index — when the
  // underlying leads change (a lead moves between sections, one gets
  // added/removed), the header/lead layout at a given index can shift, so
  // the cache must be explicitly invalidated rather than left stale.
  const listRef = useRef<VariableSizeList>(null)
  useEffect(() => {
    listRef.current?.resetAfterIndex(0)
  }, [leads])

  function Row({ index, style }: ListChildComponentProps) {
    const row = rows[index]
    if (row.type === 'header') {
      return (
        <div style={style} className={`micro-label px-3 py-2 ${row.section.dividerClass}`}>
          {row.section.title}
        </div>
      )
    }
    return (
      <div style={style}>
        <QueueCard
          lead={row.lead}
          selected={row.lead.id === selectedId}
          done={doneIds.has(row.lead.id)}
          onClick={() => onSelect(row.lead)}
        />
      </div>
    )
  }

  return (
    <aside className="flex w-[370px] shrink-0 flex-col overflow-hidden border-r border-line bg-card">
      <header className="border-b border-line px-3 py-3">
        <h2 className="text-body-md font-bold text-ink">Coordinator outreach queue</h2>
        <div className="micro-label mt-2 text-muted">
          Pool progress · {touched}/{totalPool}
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-soft">
          <div className="h-1.5 rounded-full bg-green" style={{ width: `${poolPct}%` }} />
        </div>

        <div className="mt-3 flex gap-3 font-mono text-[12px] text-muted">
          {replied.length > 0 && <span className="text-green">Replied: {replied.length}</span>}
          <span>T1: {t1s.length}</span>
          <span>T2: {t2s.length}</span>
          <span>T3: {t3s.length}</span>
        </div>

        <label className="mt-2 flex items-center gap-1.5 text-body-sm text-muted">
          <input
            type="checkbox"
            checked={isasaOnly}
            onChange={(e) => setIsasaOnly(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-line accent-green"
          />
          ISASA only
        </label>

        <p className="mt-2 flex items-center gap-1 text-body-sm text-amber">
          <Icon name="warning" size={15} filled /> Steady-state grows to ~12/day from Week 3
        </p>
      </header>

      {loading ? (
        <LoadingSpinner label="Loading queue…" />
      ) : leads.length === 0 ? (
        <div className="px-3 py-8 text-center text-body-sm text-muted">Queue is clear for today.</div>
      ) : (
        <div className="min-h-0 flex-1">
          <AutoSizer
            renderProp={({ height, width }) =>
              height && width ? (
                <VariableSizeList
                  ref={listRef}
                  height={height}
                  width={width}
                  itemCount={rows.length}
                  itemSize={(index) => (rows[index].type === 'header' ? HEADER_HEIGHT : CARD_HEIGHT)}
                >
                  {Row}
                </VariableSizeList>
              ) : null
            }
          />
        </div>
      )}
    </aside>
  )
}
