import type { Lead } from '../types'

const MERGE_FIELDS: Record<string, (lead: Lead) => string | null | undefined> = {
  first_name: (lead) => lead.contact_name?.split(' ')[0],
  school_name: (lead) => lead.school_name,
  contact_role: (lead) => lead.contact_role,
}

export function mergeTemplate(template: string, lead: Lead): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, field: string) => {
    const resolver = MERGE_FIELDS[field]
    if (!resolver) return match
    const value = resolver(lead)
    return value ?? ''
  })
}
