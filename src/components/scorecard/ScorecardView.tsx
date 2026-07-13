import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useScorecard } from '../../hooks/useScorecard'
import type { LeadStatus } from '../../types'
import MetricCard from './MetricCard'
import CloseList from './CloseList'
import LoadingSpinner from '../shared/LoadingSpinner'

const YEAR_TARGET = 126

const POOL_STATUSES: { status: LeadStatus; label: string }[] = [
  { status: 'untouched', label: 'Untouched' },
  { status: 't1-sent', label: 'T1 sent' },
  { status: 't2-sent', label: 'T2 sent' },
  { status: 't3-sent', label: 'T3 sent' },
  { status: 'reply-received', label: 'Reply received' },
  { status: 'won', label: 'Won' },
]

function MotionBProgressTable() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    supabase
      .from('leads')
      .select('status')
      .eq('motion', 'B')
      .then(({ data, error }) => {
        if (error || !data) return
        const tally: Record<string, number> = {}
        for (const row of data) {
          tally[row.status] = (tally[row.status] ?? 0) + 1
        }
        setCounts(tally)
      })
  }, [])

  if (!counts) return <LoadingSpinner label="Loading Motion B progress…" />

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
          <tr>
            {POOL_STATUSES.map((s) => (
              <th key={s.status} className="px-3 py-2 text-left">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-100">
            {POOL_STATUSES.map((s) => (
              <td key={s.status} className="px-3 py-2 font-medium text-navy">
                {counts[s.status] ?? 0}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function ScorecardView() {
  const { scorecard, loading } = useScorecard()

  if (loading && !scorecard) {
    return <LoadingSpinner label="Loading scorecard…" />
  }

  if (!scorecard) return null

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mb-8 grid grid-cols-3 gap-4">
        <MetricCard
          label="Paying schools"
          value={scorecard.paying_schools}
          sublabel={`of ${YEAR_TARGET} year-end target`}
        />
        <MetricCard label="Motion A pipeline" value={scorecard.motion_a_pipeline} />
        <MetricCard label="Motion B untouched" value={scorecard.motion_b_untouched} />
        <MetricCard label="Sponsor slots placed" value={`${scorecard.sponsor_slots_placed}/${scorecard.sponsor_slots_total}`} />
        <MetricCard
          label="Reply rate (90d)"
          value={scorecard.reply_rate_90d != null ? `${scorecard.reply_rate_90d}%` : '—'}
        />
        <MetricCard label="Pending handovers" value={scorecard.pending_handovers} />
      </div>

      <div className="mb-8">
        <h3 className="mb-2 text-sm font-semibold text-navy">CLOSE tier — Rus priority list</h3>
        <CloseList />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-navy">Motion B — pool progress</h3>
        <MotionBProgressTable />
      </div>
    </div>
  )
}
