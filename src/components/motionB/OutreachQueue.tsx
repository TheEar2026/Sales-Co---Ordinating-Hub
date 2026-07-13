import type { MotionBDailyLead } from '../../types'
import { useScorecard } from '../../hooks/useScorecard'
import QueueCard from './QueueCard'
import LoadingSpinner from '../shared/LoadingSpinner'

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

  const t1s = leads.filter((l) => l.status === 'untouched')
  const t2s = leads.filter((l) => l.status === 't1-sent')
  const t3s = leads.filter((l) => l.status === 't2-sent')

  const sections: Section[] = [
    { key: 't1', title: 'T1s — first touch today', dividerClass: 'bg-navy text-white', leads: t1s },
    { key: 't2', title: 'T2 follow-ups due today', dividerClass: 'bg-amber-light text-amber', leads: t2s },
    { key: 't3', title: 'T3 follow-ups due today', dividerClass: 'bg-gray-100 text-gray-600', leads: t3s },
  ]

  const touched = scorecard?.motion_b_touched ?? 0
  const poolPct = Math.min(100, (touched / MOTION_B_POOL) * 100)

  return (
    <div className="flex w-[370px] shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-3 py-3">
        <h2 className="text-sm font-semibold text-navy">Coordinator outreach queue</h2>
        <div className="mt-1.5 text-xs text-gray-500">
          Pool progress · {touched}/{MOTION_B_POOL}
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full bg-green" style={{ width: `${poolPct}%` }} />
        </div>

        <div className="mt-3 flex gap-3 text-xs text-gray-600">
          <span>T1: {t1s.length}</span>
          <span>T2: {t2s.length}</span>
          <span>T3: {t3s.length}</span>
        </div>

        <p className="mt-2 text-xs text-amber">⚠️ Steady-state grows to ~12/day from Week 3</p>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading queue…" />
      ) : leads.length === 0 ? (
        <div className="px-3 py-8 text-center text-sm text-gray-400">Queue is clear for today.</div>
      ) : (
        sections.map(
          (section) =>
            section.leads.length > 0 && (
              <div key={section.key}>
                <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${section.dividerClass}`}>
                  {section.title}
                </div>
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
    </div>
  )
}
