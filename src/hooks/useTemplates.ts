import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PersonaCode, Template } from '../types'

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('persona')
      .order('touch_number')
    if (error) {
      setError(error.message)
    } else {
      setTemplates((data ?? []) as Template[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { templates, loading, error, refetch: load }
}

export function activeTemplatesForPersona(templates: Template[], persona: PersonaCode | null): Template[] {
  if (!persona) return []
  return templates.filter((t) => t.persona === persona && t.is_active)
}
