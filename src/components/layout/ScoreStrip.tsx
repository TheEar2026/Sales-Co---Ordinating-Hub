import { useScorecard } from '../../hooks/useScorecard'

const YEAR_TARGET = 126

function formatZAR(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ScoreStrip() {
  const { scorecard, loading } = useScorecard()

  if (loading && !scorecard) {
    return <div className="h-16 border-b border-gray-200 bg-white" />
  }

  if (!scorecard) return null

  const progressPct = Math.min(100, (scorecard.paying_schools / YEAR_TARGET) * 100)

  return (
    <div className="grid grid-cols-5 divide-x divide-gray-200 border-b border-gray-200 bg-white text-sm">
      <div className="px-4 py-2">
        <div className="text-lg font-semibold text-green">{scorecard.paying_schools}</div>
        <div className="text-xs text-gray-500">of {YEAR_TARGET} year-end target</div>
      </div>

      <div className="px-4 py-2">
        <div className="text-lg font-semibold text-gold-mid">{scorecard.motion_a_pipeline}</div>
        <div className="text-xs text-gray-500">Motion A · {formatZAR(scorecard.motion_a_open_value)} open</div>
      </div>

      <div className="px-4 py-2">
        <div className="text-lg font-semibold text-navy">{scorecard.motion_b_untouched}</div>
        <div className="text-xs text-gray-500">Motion B untouched</div>
      </div>

      <div className="px-4 py-2">
        <div className="text-lg font-semibold text-navy">
          {scorecard.sponsor_slots_placed}/{scorecard.sponsor_slots_total}
        </div>
        <div className="text-xs text-gray-500">Sponsor slots placed</div>
      </div>

      <div className="flex flex-col justify-center px-4 py-2">
        <div className="mb-1 text-xs text-gray-500">
          Year progress · {scorecard.paying_schools}/{YEAR_TARGET}
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full bg-green" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </div>
  )
}
