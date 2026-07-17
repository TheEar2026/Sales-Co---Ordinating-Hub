export type TabKey = 'motionA' | 'motionB' | 'allLeads' | 'scorecard'

interface TabBarProps {
  active: TabKey
  onChange: (tab: TabKey) => void
  motionACount: number
  motionBCount: number
}

interface TabDef {
  key: TabKey
  label: string
  count: number
}

export default function TabBar({ active, onChange, motionACount, motionBCount }: TabBarProps) {
  const tabs: TabDef[] = [
    { key: 'motionA', label: 'Motion A', count: motionACount },
    { key: 'motionB', label: 'Motion B', count: motionBCount },
    { key: 'allLeads', label: 'All Leads', count: 0 },
    { key: 'scorecard', label: 'Scorecard', count: 0 },
  ]

  return (
    <div className="flex border-b border-line bg-card px-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative flex items-center gap-2 border-b-2 px-4 py-3 transition-colors ${
            active === tab.key
              ? 'border-brand-gold text-ink'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <span className="micro-label">{tab.label}</span>
          {tab.count > 0 && (
            <span className="rounded-full bg-soft px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
