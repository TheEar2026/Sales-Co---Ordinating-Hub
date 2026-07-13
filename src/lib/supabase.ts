import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createMockClient } from '../mock/mockClient'

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

function buildClient(): SupabaseClient {
  if (isDemoMode) {
    return createMockClient() as unknown as SupabaseClient
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase credentials (or set VITE_DEMO_MODE=true).',
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = buildClient()
