interface DatePickerProps {
  label: string
  value: string | null
  onChange: (value: string) => void
  tooltip?: string
  disabled?: boolean
}

export default function DatePicker({ label, value, onChange, tooltip, disabled }: DatePickerProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600" title={tooltip}>
      <span>{label}</span>
      <input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
      />
    </label>
  )
}
