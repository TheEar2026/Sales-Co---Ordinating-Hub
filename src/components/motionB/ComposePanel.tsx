import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useTemplates, activeTemplatesForPersona } from '../../hooks/useTemplates'
import { mergeTemplate } from '../../lib/mergeTemplate'
import type { MotionBDailyLead, TouchNumber } from '../../types'
import DatePicker from '../shared/DatePicker'
import Icon from '../shared/Icon'
import NeedsReviewBanner from '../shared/NeedsReviewBanner'
import HandoverModal from './HandoverModal'

function touchNumberForStatus(status: MotionBDailyLead['status']): TouchNumber {
  if (status === 'untouched') return 'T1'
  if (status === 't1-sent') return 'T2'
  return 'T3'
}

function nextStatusForTouch(touchNumber: TouchNumber): MotionBDailyLead['status'] {
  if (touchNumber === 'T1') return 't1-sent'
  if (touchNumber === 'T2') return 't2-sent'
  return 't3-sent'
}

interface ComposePanelProps {
  lead: MotionBDailyLead
  onDone: () => void
  onToast: (type: 'success' | 'error', message: string) => void
}

export default function ComposePanel({ lead, onDone, onToast }: ComposePanelProps) {
  const { profile } = useAuth()
  const { templates } = useTemplates()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [handoverOpen, setHandoverOpen] = useState(false)

  const hasReplied = lead.status === 'reply-received'
  const touchNumber = touchNumberForStatus(lead.status)
  const personaTemplates = useMemo(
    () => activeTemplatesForPersona(templates, lead.persona).filter((t) => t.touch_number === touchNumber),
    [templates, lead.persona, touchNumber],
  )
  const allPersonaTemplates = useMemo(
    () => activeTemplatesForPersona(templates, lead.persona),
    [templates, lead.persona],
  )

  useEffect(() => {
    const defaultTemplate = personaTemplates[0] ?? null
    setSelectedTemplateId(defaultTemplate?.id ?? null)
  }, [lead.id, personaTemplates])

  const selectedTemplate =
    allPersonaTemplates.find((t) => t.id === selectedTemplateId) ?? personaTemplates[0] ?? null

  const mergedBody = selectedTemplate ? mergeTemplate(selectedTemplate.body, lead) : ''
  const mergedSubject = selectedTemplate ? mergeTemplate(selectedTemplate.subject, lead) : ''

  async function markSent() {
    if (!profile || !selectedTemplate) return
    setBusy(true)
    const today = new Date().toISOString().slice(0, 10)

    await supabase.from('touch_log').insert({
      lead_id: lead.id,
      touch_number: touchNumber,
      sent_by: profile.role,
      sent_date: today,
      template_id: selectedTemplate.id,
    })

    await supabase
      .from('leads')
      .update({
        status: nextStatusForTouch(touchNumber),
        touch_count: lead.touch_count + 1,
        last_touch_date: today,
      })
      .eq('id', lead.id)

    setBusy(false)
    onDone()
  }

  async function editInOutlook() {
    await navigator.clipboard.writeText(`Subject: ${mergedSubject}\n\n${mergedBody}`)
    onToast('success', 'Email copied to clipboard.')
  }

  async function parkLead() {
    setBusy(true)
    await supabase.from('leads').update({ status: 'parked' }).eq('id', lead.id)
    setBusy(false)
    onDone()
  }

  async function updateT2Date(value: string) {
    await supabase.from('leads').update({ next_touch_date: value || null }).eq('id', lead.id)
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
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            {lead.persona && (
              <span className="rounded bg-soft px-1.5 py-0.5 font-bold text-muted">{lead.persona}</span>
            )}
            {hasReplied ? (
              <span className="rounded bg-green/10 px-1.5 py-0.5 font-bold text-green">Replied</span>
            ) : (
              <span className="rounded bg-soft px-1.5 py-0.5 font-bold text-muted">{touchNumber}</span>
            )}
            <span className="text-muted">Coordinator sends · hand off on reply</span>
          </div>
        </section>

        <section className="space-y-6 px-8 py-6">
          {lead.needs_review && (
            <NeedsReviewBanner leadId={lead.id} reason={lead.review_reason} onDismissed={() => {}} />
          )}

          {hasReplied ? (
            /* reply already detected (Outlook auto-detection, or noticed manually) — nothing left
               to draft, this lead is just waiting on the handover confirmation below */
            <div className="flex gap-2 rounded-lg bg-green/10 px-4 py-3 text-body-sm text-green">
              <Icon name="reply" size={18} className="mt-0.5 shrink-0" filled />
              <p>
                {lead.contact_name} has replied
                {lead.last_reply_date ? ` (last reply ${lead.last_reply_date})` : ''}. Confirm the handover below
                to send this lead to Rus — do not send another touch.
              </p>
            </div>
          ) : (
            <>
              {/* email draft */}
              <div className="overflow-hidden rounded-lg border border-email-line">
                <div className="flex items-center justify-between bg-email-bg px-4 py-2">
                  <span className="micro-label flex items-center gap-1.5 text-email-ink">
                    <Icon name="draft" size={16} /> Email draft
                  </span>
                  {allPersonaTemplates.length > 1 && (
                    <select
                      value={selectedTemplateId ?? ''}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="rounded border border-email-line bg-card px-2 py-1 text-xs"
                    >
                      {allPersonaTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="px-4 py-3">
                  {selectedTemplate ? (
                    <>
                      <div className="mb-2 text-body-md font-semibold text-ink">{mergedSubject}</div>
                      <div className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-muted">
                        {mergedBody}
                      </div>
                    </>
                  ) : (
                    <p className="text-body-sm text-muted">
                      No active template for this persona/touch combination.
                    </p>
                  )}
                </div>
              </div>

              {/* handover rule */}
              <div className="flex gap-2 rounded-lg bg-amber-light px-4 py-3 text-body-sm text-amber">
                <Icon name="notifications_active" size={18} className="mt-0.5 shrink-0" filled />
                <p>
                  If {lead.contact_name} replies with genuine interest — a pricing question, a demo request, or
                  they offer a time to talk — use the button below. Do not continue the conversation yourself.
                </p>
              </div>
            </>
          )}

          {/* school context */}
          <div>
            <h3 className="micro-label mb-2 text-muted">School context</h3>
            <p className="whitespace-pre-wrap text-body-md text-muted">
              {lead.notes || 'No notes yet.'}
            </p>
          </div>
        </section>
      </div>

      <footer className="border-t border-line bg-card px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {!hasReplied && (
              <button
                onClick={markSent}
                disabled={busy || !selectedTemplate}
                className="flex items-center gap-1.5 rounded bg-green px-4 py-2 text-body-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Icon name="check_circle" size={18} /> Sent — mark done
              </button>
            )}
            <button
              onClick={() => setHandoverOpen(true)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded border border-amber px-4 py-2 text-body-sm font-bold text-amber transition-colors hover:bg-amber-light disabled:opacity-50"
            >
              <Icon name="notifications_active" size={18} /> Flag for Rus
            </button>
            <button
              onClick={parkLead}
              disabled={busy}
              className="flex items-center gap-1.5 rounded border border-line px-4 py-2 text-body-sm font-bold text-ink transition-colors hover:bg-soft disabled:opacity-50"
            >
              <Icon name="pause_circle" size={18} /> Park
            </button>
            {!hasReplied && (
              <button
                onClick={editInOutlook}
                disabled={!selectedTemplate}
                className="flex items-center gap-1.5 rounded border border-line px-4 py-2 text-body-sm font-bold text-ink transition-colors hover:bg-soft disabled:opacity-50"
              >
                <Icon name="content_copy" size={18} /> Copy
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!hasReplied && (
              <DatePicker label="T2 if no reply:" value={lead.next_touch_date} onChange={updateT2Date} />
            )}
            <span className="flex items-center gap-1.5 rounded bg-soft px-2 py-1 text-body-sm text-ink">
              <span className="h-2 w-2 rounded-full bg-green" />
              <span className="font-semibold">Coordinator</span>
            </span>
          </div>
        </div>
      </footer>

      {handoverOpen && (
        <HandoverModal
          lead={lead}
          onClose={() => setHandoverOpen(false)}
          onSuccess={() => {
            setHandoverOpen(false)
            onToast('success', 'Lead handed to Rus. Email notification sent.')
            onDone()
          }}
          onError={(message) => onToast('error', message)}
        />
      )}
    </article>
  )
}
