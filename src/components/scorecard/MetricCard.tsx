import Icon from '../shared/Icon'

interface MetricCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon?: string
  valueClass?: string
}

export default function MetricCard({ label, value, sublabel, icon, valueClass = 'text-ink' }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-line bg-card px-4 py-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="micro-label text-muted">{label}</span>
        {icon && <Icon name={icon} size={18} className="text-line" />}
      </div>
      <div className={`text-metric-xl tabular-nums ${valueClass}`}>{value}</div>
      {sublabel && <div className="mt-1 text-body-sm text-muted">{sublabel}</div>}
    </div>
  )
}
