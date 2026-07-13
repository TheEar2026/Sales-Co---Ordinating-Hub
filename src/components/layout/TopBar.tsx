import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'

const TERM_START_DATE = new Date('2026-07-13')

function termWeek(today: Date): number {
  const diffMs = today.getTime() - TERM_START_DATE.getTime()
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
  return Math.max(1, diffWeeks + 1)
}

interface UserChipProps {
  initials: string
  dotColor: 'gold' | 'green'
  active: boolean
}

function UserChip({ initials, dotColor, active }: UserChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        active ? 'border-gold-mid bg-white/10 text-white' : 'border-white/20 text-white/60'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor === 'gold' ? 'bg-gold-mid' : 'bg-green'}`} />
      {initials}
    </span>
  )
}

interface TopBarProps {
  onOpenTemplates: () => void
}

export default function TopBar({ onOpenTemplates }: TopBarProps) {
  const { profile, signOut } = useAuth()
  const today = new Date()

  return (
    <header className="flex items-center justify-between border-b-[3px] border-gold bg-navy px-6 py-3 text-white">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold tracking-wide">the ear academy — sales</span>
        <span className="rounded bg-white/10 px-2 py-1 text-xs">
          {format(today, 'EEEE d MMMM yyyy')} · Term week {termWeek(today)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <UserChip initials="RN" dotColor="gold" active={profile?.role === 'rus'} />
        <UserChip initials="SC" dotColor="green" active={profile?.role === 'coordinator'} />

        {profile?.role === 'rus' && (
          <button
            onClick={onOpenTemplates}
            className="text-xs text-white/70 underline-offset-2 hover:text-white hover:underline"
          >
            Templates
          </button>
        )}

        <button
          onClick={signOut}
          className="rounded border border-white/30 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
