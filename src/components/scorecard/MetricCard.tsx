import Icon from '../shared/Icon'

interface MetricCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon?: string
  valueClass?: string
  progressPct?: number
  tooltip?: string
}

export default function MetricCard({
  label,
  value,
  sublabel,
  icon,
  valueClass = 'text-ink',
  progressPct,
  tooltip,
}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-line bg-card px-4 py-4" title={tooltip}>
      <div className="mb-2 flex items-center justify-between">
        <span className="micro-label text-muted">{label}</span>
        {icon && <Icon name={icon} size={18} className="text-line" />}
      </div>
      <div className={`text-metric-xl tabular-nums ${valueClass}`}>{value}</div>
      {sublabel && <div className="mt-1 text-body-sm text-muted">{sublabel}</div>}
      {progressPct != null && (
        <div className="mt-2 h-1.5 w-full rounded-full bg-soft">
          <div className="h-1.5 rounded-full bg-green" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} />
        </div>
      )}
    </div>
  )
}
