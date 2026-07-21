import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Lead } from '../../types'
import StatusChip from '../shared/StatusChip'
import TierBadge from '../shared/TierBadge'
import TouchHistory from '../motionA/TouchHistory'
import NeedsReviewBanner from '../shared/NeedsReviewBanner'

function formatZAR(value: number | null): string {
  if (!value) return '—'
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value)
}

interface AllLeadsDetailProps {
  lead: Lead
  onUpdated: () => void
}

export default function AllLeadsDetail({ lead, onUpdated }: AllLeadsDetailProps) {
  const { profile } = useAuth()
  const [notes, setNotes] = useState(lead.notes ?? '')

  useEffect(() => {
    setNotes(lead.notes ?? '')
  }, [lead.id, lead.notes])

  // Mirrors the leads_coordinator_update / leads_rus_update RLS policies:
  // coordinator can only edit leads she owns or that are Motion B; Rus can
  // edit anything. Kept in sync so this view never attempts a write that
  // the database would reject anyway.
  const canEdit = profile?.role === 'rus' || lead.owner === 'coordinator' || lead.motion === 'B'

  async function saveNotes() {
    if (!canEdit || notes === (lead.notes ?? '')) return
    await supabase.from('leads').update({ notes: notes || null }).eq('id', lead.id)
    onUpdated()
  }

  async function moveToMotionB() {
    if (!canEdit) return
    await supabase
      .from('leads')
      .update({
        motion: 'B',
        owner: 'coordinator',
        status: 'untouched',
        needs_review: true,
        review_reason: 'Revived from Parked — see notes for approach.',
      })
      .eq('id', lead.id)
    onUpdated()
  }

  return (
    <article className="flex flex-1 flex-col overflow-hidden bg-card">
      <div className="flex-1 overflow-y-auto">
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
            <span className="rounded bg-soft px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">
              Motion {lead.motion}
            </span>
            <span className="flex items-center gap-1.5 rounded bg-soft px-2 py-0.5 text-[11px] font-semibold text-ink">
              <span className={`h-1.5 w-1.5 rounded-full ${lead.owner === 'rus' ? 'bg-gold-mid' : 'bg-green'}`} />
              {lead.owner === 'rus' ? 'Owner' : 'Coordinator'}
            </span>
            {lead.status === 'parked' && canEdit && (
              <button
                onClick={moveToMotionB}
                className="rounded border border-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-gold-mid hover:bg-gold-light"
              >
                Move to Motion B
              </button>
            )}
          </div>
        </section>

        <section className="space-y-8 px-8 py-6">
          {lead.needs_review && (
            <NeedsReviewBanner leadId={lead.id} reason={lead.review_reason} onDismissed={onUpdated} />
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            <div>
              <h3 className="micro-label mb-1 text-muted">Contact email</h3>
              <p className="text-body-sm text-ink">{lead.contact_email ?? '—'}</p>
            </div>
            <div>
              <h3 className="micro-label mb-1 text-muted">Persona</h3>
              <p className="text-body-sm text-ink">{lead.persona ?? '—'}</p>
            </div>
            <div>
              <h3 className="micro-label mb-1 text-muted">AC deal ID</h3>
              <p className="text-body-sm text-ink">{lead.ac_deal_id ?? '—'}</p>
            </div>
            <div>
              <h3 className="micro-label mb-1 text-muted">Last touch</h3>
              <p className="text-body-sm text-ink">{lead.last_touch_date ?? '—'}</p>
            </div>
            <div>
              <h3 className="micro-label mb-1 text-muted">Next touch</h3>
              <p className="text-body-sm text-ink">{lead.next_touch_date ?? '—'}</p>
            </div>
            <div>
              <h3 className="micro-label mb-1 text-muted">Last reply</h3>
              <p className="text-body-sm text-ink">{lead.last_reply_date ?? '—'}</p>
            </div>
          </div>

          <div>
            <h3 className="micro-label mb-3 text-muted">Internal notes</h3>
            {canEdit ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                rows={5}
                placeholder="Full running notes for this contact…"
                className="w-full rounded-lg border border-line bg-soft p-4 text-body-md leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-gold"
              />
            ) : (
              <p className="whitespace-pre-wrap rounded-lg border border-line bg-soft p-4 text-body-md leading-relaxed text-muted">
                {lead.notes || 'No notes yet.'}
              </p>
            )}
          </div>

          <div>
            <h3 className="micro-label mb-4 text-muted">Touch history</h3>
            <TouchHistory leadId={lead.id} />
          </div>
        </section>
      </div>
    </article>
  )
}
