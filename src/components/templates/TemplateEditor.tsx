import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useTemplates } from '../../hooks/useTemplates'
import type { PersonaCode, Template } from '../../types'
import LoadingSpinner from '../shared/LoadingSpinner'

const PERSONAS: PersonaCode[] = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']

const SAMPLE_MERGE: Record<string, string> = {
  first_name: 'Alex',
  school_name: 'Riverside Primary',
  contact_role: 'Head of Music',
}

function previewMerge(text: string): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, field: string) => SAMPLE_MERGE[field] ?? match)
}

interface EditorState {
  subject: string
  body: string
}

export default function TemplateEditor({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth()
  const { templates, loading, refetch } = useTemplates()
  const [selected, setSelected] = useState<Template | null>(null)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)

  function selectTemplate(template: Template) {
    setSelected(template)
    setEditor({ subject: template.subject, body: template.body })
    setPreviewing(false)
  }

  async function save() {
    if (!selected || !editor || !profile) return
    setSaving(true)
    await supabase
      .from('templates')
      .update({
        subject: editor.subject,
        body: editor.body,
        version: selected.version + 1,
        updated_by: profile.id,
      })
      .eq('id', selected.id)
    setSaving(false)
    await refetch()
  }

  async function toggleActive(template: Template) {
    if (!template.is_active) {
      await supabase
        .from('templates')
        .update({ is_active: false })
        .eq('persona', template.persona)
        .eq('touch_number', template.touch_number)
        .eq('is_active', true)
    }
    await supabase.from('templates').update({ is_active: !template.is_active }).eq('id', template.id)
    await refetch()
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-black/30">
      <div className="m-auto flex h-[85vh] w-[90vw] max-w-5xl overflow-hidden rounded-xl bg-card shadow-2xl">
        <div className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-body-md font-bold text-ink">Templates</h2>
            <button onClick={onClose} className="text-muted hover:text-ink">
              ✕
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading templates…" />
          ) : (
            PERSONAS.map((persona) => {
              const group = templates.filter((t) => t.persona === persona)
              if (group.length === 0) return null
              return (
                <div key={persona} className="border-b border-line/60 px-3 py-2">
                  <div className="micro-label mb-1 text-muted">{persona}</div>
                  {group.map((t) => (
                    <div
                      key={t.id}
                      className={`mb-1 flex items-center justify-between rounded px-2 py-1.5 text-sm ${
                        selected?.id === t.id ? 'bg-gold-light' : 'hover:bg-app'
                      }`}
                    >
                      <button onClick={() => selectTemplate(t)} className="min-w-0 flex-1 truncate text-left">
                        <span className="mr-1 text-xs text-muted">{t.touch_number}</span>
                        {t.name}
                      </button>
                      <button
                        onClick={() => toggleActive(t)}
                        className={`ml-2 h-4 w-8 shrink-0 rounded-full transition-colors ${
                          t.is_active ? 'bg-green' : 'bg-line'
                        }`}
                        title={t.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                      >
                        <span
                          className={`block h-3.5 w-3.5 rounded-full bg-card transition-transform ${
                            t.is_active ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          {!selected || !editor ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted">
              Select a template to edit.
            </div>
          ) : previewing ? (
            <div className="flex-1">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Preview — sample data</h3>
                <button onClick={() => setPreviewing(false)} className="text-xs text-muted underline">
                  Back to edit
                </button>
              </div>
              <div className="mb-2 text-sm font-medium text-ink">{previewMerge(editor.subject)}</div>
              <div className="whitespace-pre-wrap rounded border border-line p-4 text-sm text-ink">
                {previewMerge(editor.body)}
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <label className="micro-label mb-1.5 block text-muted">Subject line</label>
              <input
                value={editor.subject}
                onChange={(e) => setEditor({ ...editor, subject: e.target.value })}
                className="mb-4 w-full rounded-lg border border-line bg-soft px-3 py-2 text-body-md focus:outline-none focus:ring-2 focus:ring-gold"
              />

              <label className="micro-label mb-1.5 block text-muted">Email body</label>
              <textarea
                value={editor.body}
                onChange={(e) => setEditor({ ...editor, body: e.target.value })}
                rows={16}
                className="w-full rounded-lg border border-line bg-soft px-3 py-2 font-mono text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <p className="mt-2 text-body-sm text-muted">
                Merge fields: {'{{first_name}}'}, {'{{school_name}}'}, {'{{contact_role}}'}
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg bg-chrome px-4 py-2 text-body-sm font-bold text-white disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setPreviewing(true)}
                  className="rounded-lg border border-line px-4 py-2 text-body-sm font-bold text-ink hover:bg-soft"
                >
                  Preview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
