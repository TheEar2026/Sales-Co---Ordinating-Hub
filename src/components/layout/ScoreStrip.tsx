import { useScorecard } from '../../hooks/useScorecard'
import Icon from '../shared/Icon'
import type { MotionADailyLead, MotionBDailyLead } from '../../types'

const YEAR_TARGET = 60

function formatZAR(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value)
}

interface MetricProps {
  label: string
  value: string | number
  valueClass?: string
  sub?: string
}

function Metric({ label, value, valueClass = 'text-ink', sub }: MetricProps) {
  return (
    <div className="px-6 first:pl-0">
      <p className="micro-label mb-1 text-muted">{label}</p>
      <p className={`text-metric-xl tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
    </div>
  )
}

interface ScoreStripProps {
  motionALeads: MotionADailyLead[]
  motionBLeads: MotionBDailyLead[]
}

export default function ScoreStrip({ motionALeads, motionBLeads }: ScoreStripProps) {
  const { scorecard, loading } = useScorecard()

  if (loading && !scorecard) {
    return <div className="h-16 border-b border-line bg-card" />
  }
  if (!scorecard) return null

  const progressPct = Math.min(100, (scorecard.paying_schools / YEAR_TARGET) * 100)
  const motionBUntouched = motionBLeads.filter((l) => l.status === 'untouched').length

  return (
    <section className="flex items-center justify-between border-b border-line bg-card px-4 py-2">
      <div className="flex divide-x divide-line">
        <Metric
          label="Paying schools"
          value={scorecard.paying_schools}
          valueClass="text-green"
          sub={`of ${YEAR_TARGET} year-end target`}
        />
        <Metric
          label="Motion A"
          value={motionALeads.length}
          valueClass="text-gold-mid"
          sub={`${formatZAR(scorecard.motion_a_open_value)} open`}
        />
        <Metric label="Motion B" value={motionBLeads.length} sub={`${motionBUntouched} untouched`} />
        <Metric
          label="Sponsor slots"
          value={`${scorecard.sponsor_slots_placed}/${scorecard.sponsor_slots_total}`}
          sub="placed"
        />
        <div className="flex flex-col justify-center px-6">
          <p className="micro-label mb-1.5 text-muted">
            Year progress · {scorecard.paying_schools}/{YEAR_TARGET}
          </p>
          <div className="h-1.5 w-40 rounded-full bg-soft">
            <div className="h-1.5 rounded-full bg-green" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Icon name="analytics" className="text-brand-gold" filled size={22} />
        <div className="flex flex-col leading-tight">
          <span className="text-body-sm font-bold text-ink">Scorecard</span>
          <span className="font-mono text-[10px] text-muted">Live</span>
        </div>
      </div>
    </section>
  )
}
