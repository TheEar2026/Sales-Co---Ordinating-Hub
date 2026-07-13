export type TabKey = 'motionA' | 'motionB' | 'scorecard'

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
    { key: 'scorecard', label: 'Scorecard', count: 0 },
  ]

  return (
    <div className="flex border-b border-gray-200 bg-white px-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
            active === tab.key
              ? 'border-gold text-navy'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
