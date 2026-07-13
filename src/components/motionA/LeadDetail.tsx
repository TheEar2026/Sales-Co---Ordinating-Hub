import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { MotionADailyLead } from '../../types'
import StatusChip from '../shared/StatusChip'
import TierBadge from '../shared/TierBadge'
import TouchHistory from './TouchHistory'
import DetailFooter from './DetailFooter'

function formatZAR(value: number | null): string {
  if (!value) return '—'
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value)
}

interface LeadDetailProps {
  lead: MotionADailyLead
  onUpdated: () => void
}

export default function LeadDetail({ lead, onUpdated }: LeadDetailProps) {
  const [nextAction, setNextAction] = useState(lead.next_action ?? '')
  const [notes, setNotes] = useState(lead.notes ?? '')

  useEffect(() => {
    setNextAction(lead.next_action ?? '')
    setNotes(lead.notes ?? '')
  }, [lead.id, lead.next_action, lead.notes])

  async function saveNextAction() {
    if (nextAction === (lead.next_action ?? '')) return
    await supabase.from('leads').update({ next_action: nextAction || null }).eq('id', lead.id)
    onUpdated()
  }

  async function saveNotes() {
    if (notes === (lead.notes ?? '')) return
    await supabase.from('leads').update({ notes: notes || null }).eq('id', lead.id)
    onUpdated()
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-navy">{lead.contact_name}</h2>
          <p className="text-sm text-gray-500">
            {lead.school_name}
            {lead.contact_role && ` · ${lead.contact_role}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusChip status={lead.status} />
            <TierBadge tier={lead.tier} />
            <span className="text-xs text-gray-500">{formatZAR(lead.ac_deal_value)}</span>
            <span className="text-xs text-gray-500">
              {lead.days_since_last_touch != null ? `${lead.days_since_last_touch}d silent` : 'No touch yet'}
            </span>
            <span className="text-xs text-gray-500">{lead.owner === 'rus' ? 'Rus' : 'Coordinator'}</span>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-gold-light px-4 py-3">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gold">
            Next action
          </label>
          <textarea
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            onBlur={saveNextAction}
            rows={2}
            placeholder="What's the next step for this contact?"
            className="w-full resize-none rounded border-none bg-transparent text-sm text-navy placeholder:text-gold/50 focus:outline-none"
          />
        </div>

        <div className="mb-5">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={5}
            placeholder="Full running notes for this contact…"
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Touch history</h3>
          <TouchHistory leadId={lead.id} />
        </div>
      </div>

      <DetailFooter lead={lead} onUpdated={onUpdated} />
    </div>
  )
}
