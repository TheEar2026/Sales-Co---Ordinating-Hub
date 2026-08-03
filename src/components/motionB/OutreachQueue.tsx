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
  stage: 'replied' | 't1' | 't2' | 't3' | 't4' | 't5'
  title: string
  dividerClass: string
  leads: MotionBDailyLead[]
}

type FlatRow = { type: 'header'; section: Section } | { type: 'lead'; lead: MotionBDailyLead }

type StageFilter = 'all' | 'replied' | 't1' | 't2' | 't3' | 't4' | 't5'

export default function OutreachQueue({ leads, loading, selectedId, doneIds, onSelect }: OutreachQueueProps) {
  const { scorecard } = useScorecard()
  const [isasaOnly, setIsasaOnly] = useState(false)
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')

  const replied = leads.filter((l) => l.status === 'reply-received')
  const t1s = leads.filter((l) => l.status === 'untouched' && (!isasaOnly || l.is_isasa))
  const t2s = leads.filter((l) => l.status === 't1-sent')
  const t3s = leads.filter((l) => l.status === 't2-sent')
  // t3-sent/t4-sent/t5-sent are the temporary T4/T5 stopgap (see
  // supabase_schema_patch_14.sql) — t5-sent has no automated next
  // step, it just stays visible here until parked.
  const t4s = leads.filter((l) => l.status === 't3-sent')
  const t5s = leads.filter((l) => l.status === 't4-sent' || l.status === 't5-sent')

  // T2-T5 are split into "send today" vs "scheduled" sub-sections so a
  // due lead is structurally separated from a not-yet-due one, rather
  // than merely sorted first within one mixed list — a due lead is
  // easy to skim past in a long list, impossible to miss under its own
  // header.
  const t2Due = t2s.filter((l) => l.needs_followup_now)
  const t2Scheduled = t2s.filter((l) => !l.needs_followup_now)
  const t3Due = t3s.filter((l) => l.needs_followup_now)
  const t3Scheduled = t3s.filter((l) => !l.needs_followup_now)
  const t4Due = t4s.filter((l) => l.needs_followup_now)
  const t4Scheduled = t4s.filter((l) => !l.needs_followup_now)
  const t5Due = t5s.filter((l) => l.needs_followup_now)
  const t5Scheduled = t5s.filter((l) => !l.needs_followup_now)

  const sections: Section[] = [
    {
      key: 'replied',
      stage: 'replied',
      title: `Replied — confirm handover (${replied.length})`,
      dividerClass: 'bg-green/10 text-green',
      leads: replied,
    },
    {
      key: 't1',
      stage: 't1',
      title: `T1s — first touch today (${t1s.length})`,
      dividerClass: 'bg-chrome text-white',
      leads: t1s,
    },
    {
      key: 't2-due',
      stage: 't2',
      title: `T2 — send today (${t2Due.length})`,
      dividerClass: 'bg-amber-light text-amber',
      leads: t2Due,
    },
    {
      key: 't2-scheduled',
      stage: 't2',
      title: `T2 — scheduled (${t2Scheduled.length})`,
      dividerClass: 'bg-soft text-muted',
      leads: t2Scheduled,
    },
    {
      key: 't3-due',
      stage: 't3',
      title: `T3 — send today (${t3Due.length})`,
      dividerClass: 'bg-amber-light text-amber',
      leads: t3Due,
    },
    {
      key: 't3-scheduled',
      stage: 't3',
      title: `T3 — scheduled (${t3Scheduled.length})`,
      dividerClass: 'bg-soft text-muted',
      leads: t3Scheduled,
    },
    {
      key: 't4-due',
      stage: 't4',
      title: `T4 — send today (${t4Due.length})`,
      dividerClass: 'bg-amber-light text-amber',
      leads: t4Due,
    },
    {
      key: 't4-scheduled',
      stage: 't4',
      title: `T4 — scheduled (${t4Scheduled.length})`,
      dividerClass: 'bg-soft text-muted',
      leads: t4Scheduled,
    },
    {
      key: 't5-due',
      stage: 't5',
      title: `T5 — send today (${t5Due.length})`,
      dividerClass: 'bg-amber-light text-amber',
      leads: t5Due,
    },
    {
      key: 't5-scheduled',
      stage: 't5',
      title: `T5 — scheduled (${t5Scheduled.length})`,
      dividerClass: 'bg-soft text-muted',
      leads: t5Scheduled,
    },
  ]

  // Filtering `sections` (not the replied/t1s/t2s/t3s arrays feeding the
  // count badges below) keeps those counts showing true totals no matter
  // which stage is selected — this is purely a display filter.
  const visibleSections = stageFilter === 'all' ? sections : sections.filter((s) => s.stage === stageFilter)

  const touched = scorecard?.motion_b_touched ?? 0
  const totalPool = touched + (scorecard?.motion_b_untouched ?? 0)
  const poolPct = totalPool > 0 ? Math.min(100, (touched / totalPool) * 100) : 0

  const rows: FlatRow[] = visibleSections.flatMap((section) =>
    section.leads.length > 0
      ? [{ type: 'header' as const, section }, ...section.leads.map((lead) => ({ type: 'lead' as const, lead }))]
      : [],
  )

  // VariableSizeList caches computed row offsets by index — when the
  // underlying leads change (a lead moves between sections, one gets
  // added/removed) or a filter changes which rows are visible, the
  // header/lead layout at a given index can shift, so the cache must be
  // explicitly invalidated rather than left stale.
  const listRef = useRef<VariableSizeList>(null)
  useEffect(() => {
    listRef.current?.resetAfterIndex(0)
  }, [leads, isasaOnly, stageFilter])

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
          <button
            onClick={() => setStageFilter('all')}
            className={stageFilter === 'all' ? 'font-bold text-ink underline' : ''}
          >
            All
          </button>
          {replied.length > 0 && (
            <button
              onClick={() => setStageFilter('replied')}
              className={`text-green ${stageFilter === 'replied' ? 'font-bold underline' : ''}`}
            >
              Replied: {replied.length}
            </button>
          )}
          <button onClick={() => setStageFilter('t1')} className={stageFilter === 't1' ? 'font-bold text-ink underline' : ''}>
            T1: {t1s.length}
          </button>
          <button onClick={() => setStageFilter('t2')} className={stageFilter === 't2' ? 'font-bold text-ink underline' : ''}>
            T2: {t2s.length}
          </button>
          <button onClick={() => setStageFilter('t3')} className={stageFilter === 't3' ? 'font-bold text-ink underline' : ''}>
            T3: {t3s.length}
          </button>
          <button onClick={() => setStageFilter('t4')} className={stageFilter === 't4' ? 'font-bold text-ink underline' : ''}>
            T4: {t4s.length}
          </button>
          <button onClick={() => setStageFilter('t5')} className={stageFilter === 't5' ? 'font-bold text-ink underline' : ''}>
            T5: {t5s.length}
          </button>
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
