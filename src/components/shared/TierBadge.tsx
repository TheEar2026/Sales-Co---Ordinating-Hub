const TIER_STYLES: Record<string, string> = {
  CLOSE: 'bg-green text-white',
  HOT: 'bg-amber text-white',
  ACTIVE: 'bg-navy text-white',
  WARM: 'bg-gold-light text-gold',
  COLD: 'bg-gray-100 text-text-muted',
  NURTURE: 'bg-gray-100 text-text-muted',
  PARKED: 'bg-gray-100 text-text-muted',
}

export default function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null
  const style = TIER_STYLES[tier] ?? 'bg-gray-100 text-text-muted'
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${style}`}
    >
      {tier}
    </span>
  )
}
