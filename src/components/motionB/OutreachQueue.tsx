import type { MotionBDailyLead } from '../../types'
import { useScorecard } from '../../hooks/useScorecard'
import QueueCard from './QueueCard'
import LoadingSpinner from '../shared/LoadingSpinner'
import Icon from '../shared/Icon'

const MOTION_B_POOL = 204

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

export default function OutreachQueue({ leads, loading, selectedId, doneIds, onSelect }: OutreachQueueProps) {
  const { scorecard } = useScorecard()

  const replied = leads.filter((l) => l.status === 'reply-received')
  const t1s = leads.filter((l) => l.status === 'untouched')
  const t2s = leads.filter((l) => l.status === 't1-sent')
  const t3s = leads.filter((l) => l.status === 't2-sent')

  const sections: Section[] = [
    { key: 'replied', title: 'Replied — confirm handover', dividerClass: 'bg-green/10 text-green', leads: replied },
    { key: 't1', title: 'T1s — first touch today', dividerClass: 'bg-chrome text-white', leads: t1s },
    { key: 't2', title: 'T2 follow-ups due today', dividerClass: 'bg-amber-light text-amber', leads: t2s },
    { key: 't3', title: 'T3 follow-ups due today', dividerClass: 'bg-soft text-muted', leads: t3s },
  ]

  const touched = scorecard?.motion_b_touched ?? 0
  const poolPct = Math.min(100, (touched / MOTION_B_POOL) * 100)

  return (
    <aside className="flex w-[370px] shrink-0 flex-col overflow-y-auto border-r border-line bg-card">
      <header className="border-b border-line px-3 py-3">
        <h2 className="text-body-md font-bold text-ink">Coordinator outreach queue</h2>
        <div className="micro-label mt-2 text-muted">
          Pool progress · {touched}/{MOTION_B_POOL}
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

        <p className="mt-2 flex items-center gap-1 text-body-sm text-amber">
          <Icon name="warning" size={15} filled /> Steady-state grows to ~12/day from Week 3
        </p>
      </header>

      {loading ? (
        <LoadingSpinner label="Loading queue…" />
      ) : leads.length === 0 ? (
        <div className="px-3 py-8 text-center text-body-sm text-muted">Queue is clear for today.</div>
      ) : (
        sections.map(
          (section) =>
            section.leads.length > 0 && (
              <div key={section.key}>
                <div className={`micro-label px-3 py-2 ${section.dividerClass}`}>{section.title}</div>
                {section.leads.map((lead) => (
                  <QueueCard
                    key={lead.id}
                    lead={lead}
                    selected={lead.id === selectedId}
                    done={doneIds.has(lead.id)}
                    onClick={() => onSelect(lead)}
                  />
                ))}
              </div>
            ),
        )
      )}
    </aside>
  )
}
