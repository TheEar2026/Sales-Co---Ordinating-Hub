export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-muted">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-gold" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
