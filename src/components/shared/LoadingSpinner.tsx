export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gold" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
