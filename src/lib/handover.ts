import { supabase } from './supabase'

export interface HandoverParams {
  leadId: string
  triggeredBy: string
  demoDate?: string | null
  notes?: string | null
}

export async function handleHandover({
  leadId,
  triggeredBy,
  demoDate,
  notes,
}: HandoverParams): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('handle_handover', {
    p_lead_id: leadId,
    p_triggered_by: triggeredBy,
    p_demo_date: demoDate || null,
    p_notes: notes || null,
  })

  return { error: error?.message ?? null }
}
