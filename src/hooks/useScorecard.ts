import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Scorecard } from '../types'

const POLL_INTERVAL_MS = 60_000

export interface ScorecardWithPipelineValue extends Scorecard {
  motion_a_open_value: number
}

export function useScorecard() {
  const [scorecard, setScorecard] = useState<ScorecardWithPipelineValue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [scorecardRes, pipelineRes] = await Promise.all([
        supabase.from('scorecard').select('*').single(),
        supabase
          .from('leads')
          .select('ac_deal_value')
          .eq('motion', 'A')
          .not('status', 'in', '(won,lost,declined,blocked,parked)'),
      ])

      if (cancelled) return

      if (scorecardRes.error) {
        setError(scorecardRes.error.message)
        setLoading(false)
        return
      }

      const openValue = (pipelineRes.data ?? []).reduce(
        (sum, row) => sum + (row.ac_deal_value ?? 0),
        0,
      )

      setScorecard({ ...(scorecardRes.data as Scorecard), motion_a_open_value: openValue })
      setError(null)
      setLoading(false)
    }

    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return { scorecard, loading, error }
}
