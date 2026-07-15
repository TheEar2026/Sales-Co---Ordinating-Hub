// In-memory Supabase stand-in for demo mode (VITE_DEMO_MODE=true).
// Implements only the slice of the supabase-js API this app calls.
import type { HandoverEvent, Lead, TouchLog } from '../types'
import {
  DEMO_PASSWORD,
  mockHandoverEvents,
  mockLeads,
  mockSponsorshipSlots,
  mockTemplates,
  mockTouchLog,
  mockUsers,
} from './mockData'

type Row = Record<string, unknown>

interface MockSession {
  user: { id: string; email: string }
}

type AuthCallback = (event: string, session: MockSession | null) => void

interface ChangeListener {
  event: string
  table: string
  callback: (payload: { eventType: string; new: Row }) => void
}

const store: Record<string, Row[]> = {
  users: mockUsers as unknown as Row[],
  leads: mockLeads as unknown as Row[],
  touch_log: mockTouchLog as unknown as Row[],
  templates: mockTemplates as unknown as Row[],
  handover_events: mockHandoverEvents as unknown as Row[],
  sponsorship_slots: mockSponsorshipSlots as unknown as Row[],
}

let session: MockSession | null = null
const authCallbacks: AuthCallback[] = []
const changeListeners: ChangeListener[] = []
let idSeq = 1000

function emitChange(table: string, eventType: string, row: Row) {
  for (const listener of changeListeners) {
    if (listener.table === table && (listener.event === '*' || listener.event === eventType)) {
      // Defer so state updates land after the mutation resolves, like real realtime.
      setTimeout(() => listener.callback({ eventType, new: row }), 0)
    }
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(from: string): number {
  return Math.floor((Date.now() - new Date(from).getTime()) / 86_400_000)
}

const OPEN_EXCLUDED = ['won', 'lost', 'declined', 'blocked', 'parked']

function motionADaily(): Row[] {
  const priority = (l: Lead): number => {
    if (l.status === 'close') return 1
    if (l.status === 'reply-received') return 2
    if (l.status === 'demo-booked') return 3
    if (l.status === 'proposal-sent') return 4
    if (l.status === 'negotiation') return 5
    if (l.status === 'demo-held') return 6
    if (l.tier === 'HOT') return 7
    return 8
  }
  return (store.leads as unknown as Lead[])
    .filter((l) => l.owner === 'rus' && !OPEN_EXCLUDED.includes(l.status))
    .map((l) => ({
      ...l,
      days_since_last_touch: l.last_touch_date ? daysBetween(l.last_touch_date) : null,
      priority_order: priority(l),
    }))
    .sort((a, b) => {
      if (a.priority_order !== b.priority_order) return a.priority_order - b.priority_order
      return (b.days_since_last_touch ?? -1) - (a.days_since_last_touch ?? -1)
    }) as unknown as Row[]
}

function motionBDaily(): Row[] {
  const order = (l: Lead): number => {
    if (l.status === 'untouched') return 1
    if (l.status === 't1-sent') return 2
    if (l.status === 't2-sent') return 3
    return 4
  }
  const today = todayStr()
  return (store.leads as unknown as Lead[])
    .filter(
      (l) =>
        l.motion === 'B' &&
        l.owner === 'coordinator' &&
        ['untouched', 't1-sent', 't2-sent'].includes(l.status) &&
        (l.status === 'untouched' || (l.next_touch_date != null && l.next_touch_date <= today)),
    )
    .map((l) => ({ ...l, queue_order: order(l) }))
    .sort((a, b) => {
      if (a.queue_order !== b.queue_order) return a.queue_order - b.queue_order
      return (a.next_touch_date ?? '9999').localeCompare(b.next_touch_date ?? '9999')
    }) as unknown as Row[]
}

function scorecard(): Row[] {
  const leads = store.leads as unknown as Lead[]
  const touches = store.touch_log as unknown as TouchLog[]
  const recent = touches.filter((t) => daysBetween(t.sent_date) <= 90)
  const replied = recent.filter((t) => t.replied).length
  return [
    {
      paying_schools: leads.filter((l) => l.status === 'won').length,
      motion_a_pipeline: leads.filter((l) => l.motion === 'A' && !OPEN_EXCLUDED.includes(l.status)).length,
      motion_b_untouched: leads.filter((l) => l.motion === 'B' && l.status === 'untouched').length,
      motion_b_touched: leads.filter((l) => l.motion === 'B' && l.status !== 'untouched').length,
      sponsor_slots_placed: store.sponsorship_slots.filter((s) => s.status === 'placed').length,
      sponsor_slots_total: store.sponsorship_slots.length,
      pending_handovers: leads.filter((l) => l.status === 'reply-received' && l.owner === 'rus').length,
      reply_rate_90d: recent.length ? Math.round((replied / recent.length) * 1000) / 10 : null,
      needs_review_count: leads.filter((l) => l.needs_review).length,
    },
  ]
}

const VIEWS: Record<string, () => Row[]> = {
  motion_a_daily: motionADaily,
  motion_b_daily: motionBDaily,
  scorecard,
}

type Filter =
  | { kind: 'eq'; column: string; value: unknown }
  | { kind: 'not-in'; column: string; values: string[] }

interface QueryResult {
  data: unknown
  error: { message: string } | null
}

class MockQueryBuilder implements PromiseLike<QueryResult> {
  private table: string
  private op: 'select' | 'insert' | 'update' = 'select'
  private filters: Filter[] = []
  private orders: { column: string; ascending: boolean }[] = []
  private payload: Row | Row[] | null = null
  private singleRow = false

  constructor(table: string) {
    this.table = table
  }

  select(_columns?: string) {
    if (this.op !== 'insert' && this.op !== 'update') this.op = 'select'
    return this
  }

  insert(payload: Row | Row[]) {
    this.op = 'insert'
    this.payload = payload
    return this
  }

  update(payload: Row) {
    this.op = 'update'
    this.payload = payload
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ kind: 'eq', column, value })
    return this
  }

  not(column: string, operator: string, value: string) {
    if (operator === 'in') {
      const values = value.replace(/^\(|\)$/g, '').split(',').map((v) => v.trim())
      this.filters.push({ kind: 'not-in', column, values })
    }
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending ?? true })
    return this
  }

  single() {
    this.singleRow = true
    return this
  }

  private matches(row: Row): boolean {
    return this.filters.every((f) => {
      if (f.kind === 'eq') return row[f.column] === f.value
      return !f.values.includes(String(row[f.column]))
    })
  }

  private execute(): QueryResult {
    if (this.op === 'insert' && this.payload) {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload]
      for (const row of rows) {
        idSeq += 1
        const full: Row = {
          id: `${this.table}-${idSeq}`,
          created_at: new Date().toISOString(),
          ...(this.table === 'touch_log'
            ? { channel: 'email', replied: false, reply_date: null, reply_summary: null, template_id: null }
            : {}),
          ...row,
        }
        store[this.table].push(full)
        emitChange(this.table, 'INSERT', full)
      }
      return { data: null, error: null }
    }

    if (this.op === 'update' && this.payload) {
      const updated: Row[] = []
      for (const row of store[this.table]) {
        if (this.matches(row)) {
          Object.assign(row, this.payload, { updated_at: new Date().toISOString() })
          updated.push(row)
        }
      }
      for (const row of updated) emitChange(this.table, 'UPDATE', row)
      return { data: null, error: null }
    }

    // select
    const view = VIEWS[this.table]
    let rows = view ? view() : [...(store[this.table] ?? [])]
    rows = rows.filter((row) => this.matches(row))

    for (const order of [...this.orders].reverse()) {
      rows.sort((a, b) => {
        const av = a[order.column]
        const bv = b[order.column]
        if (av === bv) return 0
        const cmp = String(av ?? '') < String(bv ?? '') ? -1 : 1
        return order.ascending ? cmp : -cmp
      })
    }

    // Return copies so callers never mutate the store directly.
    const copies = rows.map((r) => ({ ...r }))
    if (this.singleRow) {
      return copies.length > 0
        ? { data: copies[0], error: null }
        : { data: null, error: { message: 'Row not found' } }
    }
    return { data: copies, error: null }
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected)
  }
}

class MockChannel {
  private pending: ChangeListener[] = []

  on(_type: string, filter: { event: string; table: string }, callback: ChangeListener['callback']) {
    this.pending.push({ event: filter.event, table: filter.table, callback })
    return this
  }

  subscribe() {
    changeListeners.push(...this.pending)
    return this
  }

  unregister() {
    for (const listener of this.pending) {
      const idx = changeListeners.indexOf(listener)
      if (idx >= 0) changeListeners.splice(idx, 1)
    }
  }
}

function handleHandoverRpc(params: Row): { error: { message: string } | null } {
  const lead = (store.leads as unknown as Lead[]).find((l) => l.id === params.p_lead_id)
  if (!lead) return { error: { message: `Lead ${String(params.p_lead_id)} not found` } }

  idSeq += 1
  const event: HandoverEvent = {
    id: `handover-${idSeq}`,
    lead_id: lead.id,
    from_owner: lead.owner,
    to_owner: 'rus',
    from_motion: lead.motion,
    to_motion: 'A',
    from_status: lead.status,
    to_status: 'reply-received',
    triggered_by: (params.p_triggered_by as string) ?? null,
    demo_date: (params.p_demo_date as string) ?? null,
    notes: (params.p_notes as string) ?? null,
    notification_sent: true,
    notification_sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }
  store.handover_events.push(event as unknown as Row)

  lead.owner = 'rus'
  lead.motion = 'A'
  lead.status = 'reply-received'
  lead.demo_date = event.demo_date
  lead.demo_booked_by = 'coordinator'
  lead.last_reply_date = todayStr()
  lead.updated_at = new Date().toISOString()

  emitChange('handover_events', 'INSERT', event as unknown as Row)
  emitChange('leads', 'UPDATE', lead as unknown as Row)
  return { error: null }
}

export function createMockClient() {
  return {
    from(table: string) {
      return new MockQueryBuilder(table)
    },

    async rpc(fn: string, params: Row) {
      if (fn === 'handle_handover') return handleHandoverRpc(params)
      return { error: { message: `Unknown RPC: ${fn}` } }
    },

    channel(_name: string) {
      return new MockChannel()
    },

    removeChannel(channel: MockChannel) {
      channel.unregister()
    },

    auth: {
      async getSession() {
        return { data: { session } }
      },

      onAuthStateChange(callback: AuthCallback) {
        authCallbacks.push(callback)
        return {
          data: {
            subscription: {
              unsubscribe() {
                const idx = authCallbacks.indexOf(callback)
                if (idx >= 0) authCallbacks.splice(idx, 1)
              },
            },
          },
        }
      },

      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())
        if (!user || password !== DEMO_PASSWORD) {
          return { error: { message: 'Invalid login credentials' } }
        }
        session = { user: { id: user.id, email: user.email } }
        for (const cb of authCallbacks) cb('SIGNED_IN', session)
        return { error: null }
      },

      async signOut() {
        session = null
        for (const cb of authCallbacks) cb('SIGNED_OUT', null)
      },
    },
  }
}
