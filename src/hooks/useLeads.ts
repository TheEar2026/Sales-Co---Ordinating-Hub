import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Lead, MotionADailyLead, MotionBDailyLead } from '../types'

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

// Every lead, unfiltered by motion/status/owner — the browse view behind
// "All leads", so nothing imported or closed ever feels invisible just
// because it's not on today's priority list.
export function useAllLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setLeads((data ?? []) as Lead[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()

    const channel = supabase
      .channel('all-leads')
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
