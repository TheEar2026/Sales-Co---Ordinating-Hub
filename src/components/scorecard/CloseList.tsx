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
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="px-3 py-2 text-left">Contact / School</th>
            <th className="px-3 py-2 text-left">Stage</th>
            <th className="px-3 py-2 text-left">Value</th>
            <th className="px-3 py-2 text-left">Last touch (days)</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-4 text-center text-gray-400">
                No CLOSE-tier leads.
              </td>
            </tr>
          ) : (
            leads.map((lead) => {
              const days = daysSince(lead.last_touch_date)
              return (
                <tr key={lead.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <div className="font-medium text-navy">{lead.contact_name}</div>
                    <div className="text-xs text-gray-500">{lead.school_name}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{lead.ac_deal_stage ?? lead.status}</td>
                  <td className="px-3 py-2 text-gray-600">{formatZAR(lead.ac_deal_value)}</td>
                  <td className={`px-3 py-2 ${days != null && days > 60 ? 'font-medium text-red' : 'text-gray-600'}`}>
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
