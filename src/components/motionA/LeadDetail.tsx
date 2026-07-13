import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { MotionADailyLead } from '../../types'
import StatusChip from '../shared/StatusChip'
import TierBadge from '../shared/TierBadge'
import Icon from '../shared/Icon'
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
    <article className="flex flex-1 flex-col overflow-hidden bg-card">
      <div className="flex-1 overflow-y-auto">
        {/* header */}
        <section className="border-b border-line px-8 py-6">
          <h1 className="text-headline-lg text-ink">{lead.contact_name}</h1>
          <p className="mt-1 text-body-md text-muted">
            {lead.contact_role && <>{lead.contact_role} · </>}
            <span className="font-semibold text-brand-gold">{lead.school_name}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusChip status={lead.status} />
            <TierBadge tier={lead.tier} />
            <span className="font-mono text-[13px] text-muted">{formatZAR(lead.ac_deal_value)}</span>
            <span className="font-mono text-[13px] text-muted">
              {lead.days_since_last_touch != null ? `${lead.days_since_last_touch}d silent` : 'no touch'}
            </span>
          </div>
        </section>

        <section className="space-y-8 px-8 py-6">
          {/* Next action */}
          <div className="rounded-lg border border-brand-gold/20 bg-gold-light p-5">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="bolt" filled className="text-brand-gold" size={18} />
              <h3 className="micro-label text-brand-gold">Next action</h3>
            </div>
            <textarea
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              onBlur={saveNextAction}
              rows={2}
              placeholder="What's the next step for this contact?"
              className="w-full resize-none border-none bg-transparent text-[18px] leading-snug text-ink placeholder:text-brand-gold/50 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <h3 className="micro-label mb-3 text-muted">Internal notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={5}
              placeholder="Full running notes for this contact…"
              className="w-full rounded-lg border border-line bg-soft p-4 text-body-md leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          {/* Touch history */}
          <div>
            <h3 className="micro-label mb-4 text-muted">Touch history</h3>
            <TouchHistory leadId={lead.id} />
          </div>
        </section>
      </div>

      <DetailFooter lead={lead} onUpdated={onUpdated} />
    </article>
  )
}
