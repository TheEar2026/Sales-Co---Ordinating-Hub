import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import type { TouchLog } from '../../types'
import Icon from '../shared/Icon'
import LoadingSpinner from '../shared/LoadingSpinner'

const CHANNEL_ICON: Record<string, string> = {
  email: 'mail',
  call: 'call',
  whatsapp: 'chat',
  'in-person': 'groups',
}

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
    return <p className="text-body-sm text-muted">No touches logged yet.</p>
  }

  return (
    <ul className="space-y-2">
      {touches.map((touch) => (
        <li
          key={touch.id}
          className="flex items-center gap-3 rounded-lg border border-line bg-soft px-3 py-2.5"
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded ${
              touch.replied ? 'bg-green text-white' : 'bg-gold-light text-brand-gold'
            }`}
          >
            <Icon name={CHANNEL_ICON[touch.channel] ?? 'mail'} size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-bold text-ink">
                {touch.touch_number}
                <span className="ml-2 font-normal text-muted">
                  {touch.sent_by === 'rus' ? 'Rus' : 'Coordinator'} · {touch.channel}
                  {touch.replied && ' · replied'}
                </span>
              </span>
              <span className="font-mono text-[11px] text-muted">
                {format(new Date(touch.sent_date), 'd MMM yyyy')}
              </span>
            </div>
            {touch.reply_summary && (
              <p className="mt-0.5 text-body-sm text-muted">{touch.reply_summary}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
