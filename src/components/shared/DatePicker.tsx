import { useEffect, useState } from 'react'

interface DatePickerProps {
  label: string
  value: string | null
  onChange: (value: string) => void
  tooltip?: string
  disabled?: boolean
}

// A native <input type="date"> edits day/month/year as separate segments.
// Committing to the database (and refreshing the view) on every raw
// onChange means a mid-typing re-render can land between segments and
// stomp on the browser's in-progress edit — e.g. "2026" collapsing to
// "0006". Buffering locally and only committing on blur matches every
// other editable field in the app (notes, contact fields) and avoids this.
export default function DatePicker({ label, value, onChange, tooltip, disabled }: DatePickerProps) {
  const [draft, setDraft] = useState(value ?? '')

  useEffect(() => {
    setDraft(value ?? '')
  }, [value])

  function commit() {
    if (draft !== (value ?? '')) onChange(draft)
  }

  return (
    <label className="flex items-center gap-2 text-sm text-muted" title={tooltip}>
      <span>{label}</span>
      <input
        type="date"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        disabled={disabled}
        className="rounded border border-line px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
      />
    </label>
  )
}
