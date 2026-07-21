import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useScorecard } from '../../hooks/useScorecard'
import type { LeadStatus } from '../../types'
import MetricCard from './MetricCard'
import CloseList from './CloseList'
import LoadingSpinner from '../shared/LoadingSpinner'

const YEAR_TARGET = 60

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
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full text-body-sm">
        <thead className="bg-soft">
          <tr>
            {POOL_STATUSES.map((s) => (
              <th key={s.status} className="micro-label px-3 py-2 text-left text-muted">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-line">
            {POOL_STATUSES.map((s) => (
              <td key={s.status} className="px-3 py-2 text-metric-xl tabular-nums text-ink">
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
    <div className="flex-1 overflow-y-auto bg-soft px-6 py-6">
      <div className="mb-8 grid grid-cols-3 gap-4">
        <MetricCard
          label="Paying schools"
          value={scorecard.paying_schools}
          sublabel={`of ${YEAR_TARGET} year-end target`}
          icon="school"
          valueClass="text-green"
        />
        <MetricCard label="Motion A pipeline" value={scorecard.motion_a_pipeline} icon="analytics" valueClass="text-gold-mid" />
        <MetricCard label="Motion B untouched" value={scorecard.motion_b_untouched} icon="mark_email_unread" />
        <MetricCard
          label="Sponsor slots placed"
          value={`${scorecard.sponsor_slots_placed}/${scorecard.sponsor_slots_total}`}
          icon="campaign"
        />
        <MetricCard
          label="Reply rate (90d)"
          value={scorecard.reply_rate_90d != null ? `${scorecard.reply_rate_90d}%` : '—'}
          icon="reply_all"
        />
        <MetricCard label="Pending handovers" value={scorecard.pending_handovers} icon="assignment_turned_in" />
        <MetricCard
          label="Needs review"
          value={scorecard.needs_review_count}
          icon="warning"
          valueClass={scorecard.needs_review_count > 0 ? 'text-amber' : 'text-ink'}
        />
      </div>

      <div className="mb-8">
        <h3 className="micro-label mb-3 text-ink">CLOSE tier — Rus priority list</h3>
        <CloseList />
      </div>

      <div>
        <h3 className="micro-label mb-3 text-ink">Motion B — pool progress</h3>
        <MotionBProgressTable />
      </div>
    </div>
  )
}
