import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useMotionALeads, useMotionBLeads } from '../hooks/useLeads'
import type { MotionADailyLead, MotionBDailyLead } from '../types'
import TopBar from '../components/layout/TopBar'
import ScoreStrip from '../components/layout/ScoreStrip'
import TabBar, { type TabKey } from '../components/layout/TabBar'
import LeadList from '../components/motionA/LeadList'
import LeadDetail from '../components/motionA/LeadDetail'
import OutreachQueue from '../components/motionB/OutreachQueue'
import ComposePanel from '../components/motionB/ComposePanel'
import AllLeadsView from '../components/allLeads/AllLeadsView'
import ScorecardView from '../components/scorecard/ScorecardView'
import TemplateEditor from '../components/templates/TemplateEditor'

interface Toast {
  type: 'success' | 'error'
  message: string
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<TabKey>('motionA')
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const { leads: motionALeads, loading: motionALoading, refetch: refetchA } = useMotionALeads()
  const { leads: motionBLeads, loading: motionBLoading, refetch: refetchB } = useMotionBLeads()

  const [selectedALead, setSelectedALead] = useState<MotionADailyLead | null>(null)
  const [selectedBLead, setSelectedBLead] = useState<MotionBDailyLead | null>(null)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!selectedALead) return
    const fresh = motionALeads.find((l) => l.id === selectedALead.id)
    setSelectedALead(fresh ?? null)
  }, [motionALeads, selectedALead])

  useEffect(() => {
    if (!selectedBLead) return
    const fresh = motionBLeads.find((l) => l.id === selectedBLead.id)
    setSelectedBLead(fresh ?? null)
  }, [motionBLeads, selectedBLead])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (profile?.role !== 'rus') return

    const channel = supabase
      .channel('handover-events-toast')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'handover_events' },
        async (payload) => {
          const leadId = (payload.new as { lead_id: string }).lead_id
          const { data } = await supabase
            .from('leads')
            .select('contact_name, school_name')
            .eq('id', leadId)
            .single()
          if (data) {
            setToast({
              type: 'success',
              message: `New lead from coordinator: ${data.contact_name} at ${data.school_name}`,
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.role])

  function markBLeadDone(leadId: string) {
    setDoneIds((prev) => new Set(prev).add(leadId))
    refetchB()
  }

  return (
    <div className="flex h-screen flex-col bg-app">
      <TopBar onOpenTemplates={() => setTemplatesOpen(true)} />
      <ScoreStrip motionALeads={motionALeads} motionBLeads={motionBLeads} />
      <TabBar
        active={tab}
        onChange={setTab}
        motionACount={motionALeads.length}
        motionBCount={motionBLeads.length}
      />

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green' : 'bg-red'
          }`}
        >
          {toast.message}
        </div>
      )}

      {tab === 'motionA' && (
        <div className="flex flex-1 overflow-hidden">
          <LeadList
            leads={motionALeads}
            loading={motionALoading}
            selectedId={selectedALead?.id ?? null}
            onSelect={setSelectedALead}
          />
          {selectedALead ? (
            <LeadDetail lead={selectedALead} onUpdated={refetchA} />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-soft text-body-md text-muted">
              Select a lead to see details.
            </div>
          )}
        </div>
      )}

      {tab === 'motionB' && (
        <div className="flex flex-1 overflow-hidden">
          <OutreachQueue
            leads={motionBLeads}
            loading={motionBLoading}
            selectedId={selectedBLead?.id ?? null}
            doneIds={doneIds}
            onSelect={setSelectedBLead}
          />
          {selectedBLead ? (
            <ComposePanel
              lead={selectedBLead}
              onDone={() => markBLeadDone(selectedBLead.id)}
              onToast={(type, message) => setToast({ type, message })}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-soft text-body-md text-muted">
              Select a lead from the queue.
            </div>
          )}
        </div>
      )}

      {tab === 'allLeads' && <AllLeadsView />}

      {tab === 'scorecard' && <ScorecardView />}

      {templatesOpen && profile?.role === 'rus' && (
        <TemplateEditor onClose={() => setTemplatesOpen(false)} />
      )}
    </div>
  )
}
