import { useState } from 'react'
import { handleHandover } from '../../lib/handover'
import { useAuth } from '../../hooks/useAuth'
import type { MotionBDailyLead } from '../../types'
import Icon from '../shared/Icon'

interface HandoverModalProps {
  lead: MotionBDailyLead
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export default function HandoverModal({ lead, onClose, onSuccess, onError }: HandoverModalProps) {
  const { profile } = useAuth()
  const [demoDate, setDemoDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function confirm() {
    if (!profile) return
    setSubmitting(true)
    const { error } = await handleHandover({
      leadId: lead.id,
      triggeredBy: profile.id,
      demoDate: demoDate ? new Date(demoDate).toISOString() : null,
      notes: notes || null,
    })
    setSubmitting(false)

    if (error) {
      onError(error)
      return
    }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-2xl">
        <div className="mb-1 flex items-center gap-2">
          <Icon name="notifications_active" size={20} className="text-amber" filled />
          <h3 className="text-body-md font-bold text-ink">Hand this lead to Rus</h3>
        </div>
        <p className="mb-4 text-body-sm text-muted">
          {lead.contact_name} · {lead.school_name}
        </p>

        <label className="micro-label mb-1.5 block text-muted">
          Demo date/time if already booked
        </label>
        <input
          type="datetime-local"
          value={demoDate}
          onChange={(e) => setDemoDate(e.target.value)}
          className="mb-4 w-full rounded-lg border border-line bg-soft px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />

        <label className="micro-label mb-1.5 block text-muted">Notes for Rus (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mb-4 w-full rounded-lg border border-line bg-soft px-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-body-sm font-bold text-muted">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-green px-4 py-2 text-body-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Icon name="check_circle" size={18} /> Confirm handover
          </button>
        </div>
      </div>
    </div>
  )
}
