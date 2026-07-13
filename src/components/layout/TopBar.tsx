import { format } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import EarLogo from '../shared/EarLogo'
import Icon from '../shared/Icon'

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
        active ? 'border-gold-mid bg-white/10 text-white' : 'border-white/20 text-white/50'
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
  const { theme, toggle } = useTheme()
  const today = new Date()

  return (
    <header className="flex h-[56px] items-center justify-between border-b-4 border-brand-gold bg-chrome px-4 text-white">
      <div className="flex items-center gap-3">
        <EarLogo className="h-8 w-auto text-gold-mid" />
        <span className="micro-label text-white/50">Sales</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="micro-label text-white/60">
          {format(today, 'd MMM yyyy')} · Term wk {termWeek(today)}
        </span>

        <div className="flex items-center gap-2">
          <UserChip initials="RN" dotColor="gold" active={profile?.role === 'rus'} />
          <UserChip initials="SC" dotColor="green" active={profile?.role === 'coordinator'} />
        </div>

        {profile?.role === 'rus' && (
          <button
            onClick={onOpenTemplates}
            className="micro-label text-white/60 transition-colors hover:text-brand-gold"
          >
            Templates
          </button>
        )}

        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
          className="flex items-center justify-center rounded p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={18} />
        </button>

        <button
          onClick={signOut}
          className="rounded border border-white/30 px-3 py-1 text-xs text-white/80 transition-colors hover:bg-white/10"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
