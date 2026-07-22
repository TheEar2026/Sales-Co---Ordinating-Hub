import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Lead, MotionADailyLead, MotionBDailyLead } from '../types'

const PAGE_SIZE = 500

// Supabase's PostgREST API caps any single response at a project-configured
// "max rows" limit (commonly 1000) — a plain .select('*') silently truncates
// once a table/view has more matching rows than that, with no error. Paging
// through in fixed-size chunks until a short page signals the end avoids
// this regardless of how large the dataset grows or what the cap is set to.
async function fetchAllRows<T>(
  queryFactory: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<{ data: T[]; error: string | null }> {
  const allRows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await queryFactory(from, from + PAGE_SIZE - 1)
    if (error) return { data: allRows, error: error.message }
    if (!data || data.length === 0) break
    allRows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return { data: allRows, error: null }
}

export function useMotionALeads() {
  const [leads, setLeads] = useState<MotionADailyLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await fetchAllRows<MotionADailyLead>((from, to) =>
      supabase.from('motion_a_daily').select('*').range(from, to),
    )
    if (error) {
      setError(error)
    } else {
      setLeads(data)
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
    const { data, error } = await fetchAllRows<Lead>((from, to) =>
      supabase
        .from('leads')
        .select('*')
        .order('updated_at', { ascending: false })
        .order('id')
        .range(from, to),
    )
    if (error) {
      setError(error)
    } else {
      setLeads(data)
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
    const { data, error } = await fetchAllRows<MotionBDailyLead>((from, to) =>
      supabase.from('motion_b_daily').select('*').range(from, to),
    )
    if (error) {
      setError(error)
    } else {
      setLeads(data)
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
