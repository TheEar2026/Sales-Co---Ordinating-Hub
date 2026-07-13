const TIER_STYLES: Record<string, string> = {
  CLOSE: 'bg-green text-white',
  HOT: 'bg-amber text-white',
  ACTIVE: 'bg-chrome text-white',
  WARM: 'bg-gold-light text-gold',
  COLD: 'bg-soft text-muted',
  NURTURE: 'bg-soft text-muted',
  PARKED: 'bg-soft text-muted',
}

export default function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null
  const style = TIER_STYLES[tier] ?? 'bg-soft text-muted'
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${style}`}
    >
      {tier}
    </span>
  )
}
