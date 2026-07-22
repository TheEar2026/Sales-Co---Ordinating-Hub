import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Lead } from '../../types'

interface ContactFieldsEditorProps {
  lead: Pick<Lead, 'id' | 'contact_name' | 'contact_role' | 'contact_email' | 'contact_phone'>
  canEdit: boolean
  onUpdated: () => void
}

interface FieldProps {
  label: string
  value: string
  editable: boolean
  onChange: (value: string) => void
  onBlur: () => void
  type?: string
  placeholder?: string
}

function Field({ label, value, editable, onChange, onBlur, type = 'text', placeholder }: FieldProps) {
  return (
    <div>
      <h3 className="micro-label mb-1 text-muted">{label}</h3>
      {editable ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full rounded border border-line bg-soft px-2 py-1.5 text-body-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold"
        />
      ) : (
        <p className="text-body-sm text-ink">{value || '—'}</p>
      )}
    </div>
  )
}

// Editable contact_name / contact_role / contact_email / contact_phone,
// shared between AllLeadsDetail and ComposePanel so the "fill this in as
// you research the lead" behavior (and its save-on-blur logic) lives in
// one place rather than two.
export default function ContactFieldsEditor({ lead, canEdit, onUpdated }: ContactFieldsEditorProps) {
  const [name, setName] = useState(lead.contact_name)
  const [role, setRole] = useState(lead.contact_role ?? '')
  const [email, setEmail] = useState(lead.contact_email ?? '')
  const [phone, setPhone] = useState(lead.contact_phone ?? '')

  useEffect(() => {
    setName(lead.contact_name)
    setRole(lead.contact_role ?? '')
    setEmail(lead.contact_email ?? '')
    setPhone(lead.contact_phone ?? '')
  }, [lead.id, lead.contact_name, lead.contact_role, lead.contact_email, lead.contact_phone])

  async function saveField(column: string, value: string, current: string | null, allowEmpty: boolean) {
    if (!canEdit) return
    const trimmed = value.trim()
    if (!allowEmpty && !trimmed) return // contact_name is NOT NULL — never save it blank
    const normalized = trimmed || null
    if (normalized === (current ?? null)) return
    await supabase
      .from('leads')
      .update({ [column]: normalized })
      .eq('id', lead.id)
    onUpdated()
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
      <Field
        label="Contact name"
        value={name}
        editable={canEdit}
        onChange={setName}
        onBlur={() => saveField('contact_name', name, lead.contact_name, false)}
        placeholder="Please confirm Lead"
      />
      <Field
        label="Role"
        value={role}
        editable={canEdit}
        onChange={setRole}
        onBlur={() => saveField('contact_role', role, lead.contact_role, true)}
        placeholder="e.g. Principal"
      />
      <Field
        label="Email"
        value={email}
        editable={canEdit}
        onChange={setEmail}
        onBlur={() => saveField('contact_email', email, lead.contact_email, true)}
        type="email"
      />
      <Field
        label="Phone"
        value={phone}
        editable={canEdit}
        onChange={setPhone}
        onBlur={() => saveField('contact_phone', phone, lead.contact_phone, true)}
        type="tel"
      />
    </div>
  )
}
