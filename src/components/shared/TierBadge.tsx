const TIER_STYLES: Record<string, string> = {
  CLOSE: 'bg-green text-white',
  HOT: 'bg-amber text-white',
  ACTIVE: 'bg-gold-mid text-white',
  WARM: 'bg-gold-light text-gold',
  COLD: 'bg-gray-100 text-gray-500',
  NURTURE: 'bg-gray-100 text-gray-500',
  PARKED: 'bg-gray-100 text-gray-400',
}

export default function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null
  const style = TIER_STYLES[tier] ?? 'bg-gray-100 text-gray-500'
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style}`}>
      {tier}
    </span>
  )
}
