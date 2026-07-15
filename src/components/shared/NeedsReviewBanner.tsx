import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Icon from './Icon'

interface NeedsReviewBannerProps {
  leadId: string
  reason: string | null
  onDismissed: () => void
}

// Shown on a lead's detail panel when it was auto-created by the AC
// deal-sync webhook with no existing match — someone needs to confirm
// the contact/school details before trusting the record.
export default function NeedsReviewBanner({ leadId, reason, onDismissed }: NeedsReviewBannerProps) {
  const [dismissing, setDismissing] = useState(false)

  async function dismiss() {
    setDismissing(true)
    await supabase.from('leads').update({ needs_review: false, review_reason: null }).eq('id', leadId)
    setDismissing(false)
    onDismissed()
  }

  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-light px-4 py-3 text-body-sm text-amber">
      <Icon name="warning" size={18} filled className="mt-0.5 shrink-0" />
      <p className="flex-1">{reason ?? 'This lead needs review.'}</p>
      <button
        onClick={dismiss}
        disabled={dismissing}
        className="shrink-0 rounded border border-amber px-2 py-1 text-[11px] font-bold uppercase tracking-wide hover:bg-amber hover:text-white disabled:opacity-50"
      >
        Confirmed
      </button>
    </div>
  )
}
