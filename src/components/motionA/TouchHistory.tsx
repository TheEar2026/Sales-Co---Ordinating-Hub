import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import type { TouchLog } from '../../types'
import LoadingSpinner from '../shared/LoadingSpinner'

export default function TouchHistory({ leadId }: { leadId: string }) {
  const [touches, setTouches] = useState<TouchLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    supabase
      .from('touch_log')
      .select('*')
      .eq('lead_id', leadId)
      .order('sent_date', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setTouches((data ?? []) as TouchLog[])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [leadId])

  if (loading) return <LoadingSpinner label="Loading touch history…" />

  if (touches.length === 0) {
    return <p className="text-sm text-gray-400">No touches logged yet.</p>
  }

  return (
    <ul className="space-y-2">
      {touches.map((touch) => (
        <li key={touch.id} className="rounded border border-gray-100 px-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-navy">{touch.touch_number}</span>
            <span className="text-xs text-gray-400">{format(new Date(touch.sent_date), 'd MMM yyyy')}</span>
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            Sent by {touch.sent_by === 'rus' ? 'Rus' : 'Coordinator'} · {touch.channel}
            {touch.replied && ' · Replied'}
          </div>
          {touch.reply_summary && <div className="mt-1 text-xs text-gray-600">{touch.reply_summary}</div>}
        </li>
      ))}
    </ul>
  )
}
