import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { LeadStatus, MotionADailyLead, TouchNumber } from '../../types'
import DatePicker from '../shared/DatePicker'
import Icon from '../shared/Icon'

const REPLY_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'demo-booked', label: 'Demo booked' },
  { value: 'proposal-sent', label: 'Proposal sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'close', label: 'Close' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

function nextTouchNumber(touchCount: number): TouchNumber {
  const n = Math.min(Math.max(touchCount + 1, 1), 8)
  return `T${n}` as TouchNumber
}

interface DetailFooterProps {
  lead: MotionADailyLead
  onUpdated: () => void
}

export default function DetailFooter({ lead, onUpdated }: DetailFooterProps) {
  const { profile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [replyModalOpen, setReplyModalOpen] = useState(false)
  const [replyStatus, setReplyStatus] = useState<LeadStatus>('demo-booked')
  const [replySummary, setReplySummary] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')

  async function markContacted() {
    if (!profile) return
    setBusy(true)
    const today = new Date().toISOString().slice(0, 10)

    await supabase.from('touch_log').insert({
      lead_id: lead.id,
      touch_number: nextTouchNumber(lead.touch_count),
      sent_by: profile.role,
      sent_date: today,
    })

    await supabase
      .from('leads')
      .update({ touch_count: lead.touch_count + 1, last_touch_date: today })
      .eq('id', lead.id)

    setBusy(false)
    onUpdated()
  }

  async function confirmReply() {
    setBusy(true)
    const today = new Date().toISOString().slice(0, 10)

    await supabase
      .from('leads')
      .update({
        status: replyStatus,
        last_reply_date: today,
        first_reply_date: lead.first_reply_date ?? today,
        notes: replySummary
          ? [lead.notes, `[${today}] Reply: ${replySummary}`].filter(Boolean).join('\n')
          : lead.notes,
      })
      .eq('id', lead.id)

    setBusy(false)
    setReplyModalOpen(false)
    setReplySummary('')
    onUpdated()
  }

  async function saveNote() {
    if (!noteText.trim()) {
      setNoteOpen(false)
      return
    }
    setBusy(true)
    const today = new Date().toISOString().slice(0, 10)
    await supabase
      .from('leads')
      .update({ notes: [lead.notes, `[${today}] ${noteText.trim()}`].filter(Boolean).join('\n') })
      .eq('id', lead.id)
    setBusy(false)
    setNoteText('')
    setNoteOpen(false)
    onUpdated()
  }

  async function updateNextTouchDate(value: string) {
    await supabase.from('leads').update({ next_touch_date: value || null }).eq('id', lead.id)
    onUpdated()
  }

  return (
    <div className="border-t border-line bg-card px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      {noteOpen && (
        <div className="mb-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            placeholder="Add a note…"
            className="w-full rounded border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <div className="mt-1 flex gap-2">
            <button
              onClick={saveNote}
              disabled={busy}
              className="rounded bg-chrome px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              Save note
            </button>
            <button onClick={() => setNoteOpen(false)} className="text-xs text-muted">
              Cancel
            </button>
          </div>
        </div>
      )}

      {replyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-lg bg-card p-5 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold text-ink">Log reply</h3>
            <label className="mb-1 block text-xs font-medium text-muted">New status</label>
            <select
              value={replyStatus}
              onChange={(e) => setReplyStatus(e.target.value as LeadStatus)}
              className="mb-3 w-full rounded border border-line px-2 py-1.5 text-sm"
            >
              {REPLY_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <label className="mb-1 block text-xs font-medium text-muted">What did they say?</label>
            <textarea
              value={replySummary}
              onChange={(e) => setReplySummary(e.target.value)}
              rows={3}
              className="mb-3 w-full rounded border border-line px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReplyModalOpen(false)}
                className="rounded px-3 py-1.5 text-sm text-muted"
              >
                Cancel
              </button>
              <button
                onClick={confirmReply}
                disabled={busy}
                className="rounded bg-gold-mid px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={markContacted}
            disabled={busy}
            className="flex items-center gap-1.5 rounded bg-green px-4 py-2 text-body-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Icon name="check_circle" size={18} /> Mark contacted
          </button>
          <button
            onClick={() => setReplyModalOpen(true)}
            disabled={busy}
            className="flex items-center gap-1.5 rounded bg-gold-mid px-4 py-2 text-body-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Icon name="reply" size={18} /> Reply received
          </button>
          <button
            onClick={() => setNoteOpen(true)}
            disabled={busy}
            className="flex items-center gap-1.5 rounded border border-line px-4 py-2 text-body-sm font-bold text-ink transition-colors hover:bg-soft disabled:opacity-50"
          >
            <Icon name="edit_note" size={18} /> Log note
          </button>
        </div>

        <div className="flex items-center gap-4">
          <DatePicker
            label="Next touch:"
            value={lead.next_touch_date}
            onChange={updateNextTouchDate}
            tooltip="Set based on what this contact needs — not a fixed interval."
          />
          <span className="flex items-center gap-1.5 rounded bg-soft px-2 py-1 text-body-sm text-ink">
            <span className={`h-2 w-2 rounded-full ${lead.owner === 'rus' ? 'bg-gold-mid' : 'bg-green'}`} />
            <span className="font-semibold">{lead.owner === 'rus' ? 'Rus' : 'Coordinator'}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
