interface MetricCardProps {
  label: string
  value: string | number
  sublabel?: string
}

export default function MetricCard({ label, value, sublabel }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
      <div className="text-2xl font-semibold text-navy">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
      {sublabel && <div className="mt-0.5 text-xs text-gray-400">{sublabel}</div>}
    </div>
  )
}
