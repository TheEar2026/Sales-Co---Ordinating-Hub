// This project's Tailwind config overrides `green`/`amber` as flat
// colors, not shade scales — bg-green-500/bg-amber-500 etc. don't exist
// as classes. Use the actual tokens (green, green-light, blue-500 is
// untouched so the default scale still works, amber) instead.
const BAND_STYLES: Record<number, string> = {
  1: 'bg-green text-white',
  2: 'bg-green-light text-green',
  3: 'bg-blue-500 text-white',
  4: 'bg-amber text-white',
}

interface IsasaBadgeProps {
  isIsasa: boolean
  band: number | null
}

export default function IsasaBadge({ isIsasa, band }: IsasaBadgeProps) {
  if (!isIsasa || band == null) return null
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
        BAND_STYLES[band] ?? 'bg-soft text-muted'
      }`}
    >
      ISASA · Band {band}
    </span>
  )
}
