import { useState } from 'react'
import { handleHandover } from '../../lib/handover'
import { useAuth } from '../../hooks/useAuth'
import type { MotionBDailyLead } from '../../types'

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
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h3 className="mb-1 text-base font-semibold text-navy">Hand this lead to Rus</h3>
        <p className="mb-3 text-xs text-gray-500">
          {lead.contact_name} · {lead.school_name}
        </p>

        <label className="mb-1 block text-xs font-medium text-gray-600">
          Demo date/time if already booked
        </label>
        <input
          type="datetime-local"
          value={demoDate}
          onChange={(e) => setDemoDate(e.target.value)}
          className="mb-3 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        />

        <label className="mb-1 block text-xs font-medium text-gray-600">Notes for Rus (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded px-3 py-1.5 text-sm text-gray-500">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={submitting}
            className="rounded bg-green px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Confirm handover
          </button>
        </div>
      </div>
    </div>
  )
}
