import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MotionADailyLead, MotionBDailyLead } from '../types'

export function useMotionALeads() {
  const [leads, setLeads] = useState<MotionADailyLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('motion_a_daily').select('*')
    if (error) {
      setError(error.message)
    } else {
      setLeads((data ?? []) as MotionADailyLead[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()

    const channel = supabase
      .channel('motion-a-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return { leads, loading, error, refetch: load }
}

export function useMotionBLeads() {
  const [leads, setLeads] = useState<MotionBDailyLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('motion_b_daily').select('*')
    if (error) {
      setError(error.message)
    } else {
      setLeads((data ?? []) as MotionBDailyLead[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()

    const channel = supabase
      .channel('motion-b-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return { leads, loading, error, refetch: load }
}
