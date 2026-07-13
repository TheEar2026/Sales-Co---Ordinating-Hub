import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useTemplates, activeTemplatesForPersona } from '../../hooks/useTemplates'
import { mergeTemplate } from '../../lib/mergeTemplate'
import type { MotionBDailyLead, TouchNumber } from '../../types'
import DatePicker from '../shared/DatePicker'
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
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-navy">{lead.contact_name}</h2>
          <p className="text-sm text-gray-500">
            {lead.school_name}
            {lead.contact_role && ` · ${lead.contact_role}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {lead.persona && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold text-gray-500">{lead.persona}</span>
            )}
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold text-gray-500">{touchNumber}</span>
            <span className="text-gray-400">Coordinator sends · hand off on reply</span>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between rounded-t-lg bg-blue-50 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">Email draft</span>
            {allPersonaTemplates.length > 1 && (
              <select
                value={selectedTemplateId ?? ''}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="rounded border border-blue-200 bg-white px-2 py-1 text-xs"
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
                <div className="mb-2 text-sm font-medium text-navy">{mergedSubject}</div>
                <div className="whitespace-pre-wrap text-sm text-gray-700">{mergedBody}</div>
              </>
            ) : (
              <p className="text-sm text-gray-400">No active template for this persona/touch combination.</p>
            )}
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-amber-light px-4 py-3 text-sm text-amber">
          If {lead.contact_name} replies with genuine interest — a pricing question, a demo request, or they offer
          a time to talk — use the button below. Do not continue the conversation yourself.
        </div>

        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">School context</h3>
          <p className="whitespace-pre-wrap text-sm text-gray-600">{lead.notes || 'No notes yet.'}</p>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={markSent}
              disabled={busy || !selectedTemplate}
              className="rounded bg-green px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              ✓ Sent — mark done
            </button>
            <button
              onClick={() => setHandoverOpen(true)}
              disabled={busy}
              className="rounded border border-amber px-3 py-1.5 text-sm font-medium text-amber disabled:opacity-50"
            >
              🔔 Flag for Rus — reply received
            </button>
            <button
              onClick={parkLead}
              disabled={busy}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-50"
            >
              Park — wrong contact
            </button>
            <button
              onClick={editInOutlook}
              disabled={!selectedTemplate}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-50"
            >
              Edit in Outlook
            </button>
          </div>

          <div className="flex items-center gap-4">
            <DatePicker label="T2 if no reply:" value={lead.next_touch_date} onChange={updateT2Date} />
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-green" />
              Coordinator
            </span>
          </div>
        </div>
      </div>

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
    </div>
  )
}
