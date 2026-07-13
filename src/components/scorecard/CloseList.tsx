import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Lead } from '../../types'
import LoadingSpinner from '../shared/LoadingSpinner'

function formatZAR(value: number | null): string {
  if (!value) return '—'
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value)
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diffMs = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diffMs / (24 * 60 * 60 * 1000))
}

export default function CloseList() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('leads')
      .select('*')
      .eq('tier', 'CLOSE')
      .then(({ data, error }) => {
        if (!error) setLeads((data ?? []) as Lead[])
        setLoading(false)
      })
  }, [])

  if (loading) return <LoadingSpinner label="Loading CLOSE list…" />

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full text-body-sm">
        <thead className="bg-soft">
          <tr>
            <th className="micro-label px-3 py-2 text-left text-muted">Contact / School</th>
            <th className="micro-label px-3 py-2 text-left text-muted">Stage</th>
            <th className="micro-label px-3 py-2 text-left text-muted">Value</th>
            <th className="micro-label px-3 py-2 text-left text-muted">Last touch (days)</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-4 text-center text-muted">
                No CLOSE-tier leads.
              </td>
            </tr>
          ) : (
            leads.map((lead) => {
              const days = daysSince(lead.last_touch_date)
              return (
                <tr key={lead.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <div className="font-bold text-ink">{lead.contact_name}</div>
                    <div className="text-[12px] text-muted">{lead.school_name}</div>
                  </td>
                  <td className="px-3 py-2 text-muted">{lead.ac_deal_stage ?? lead.status}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-muted">
                    {formatZAR(lead.ac_deal_value)}
                  </td>
                  <td
                    className={`px-3 py-2 font-mono tabular-nums ${
                      days != null && days > 60 ? 'font-bold text-red' : 'text-muted'
                    }`}
                  >
                    {days ?? '—'}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
