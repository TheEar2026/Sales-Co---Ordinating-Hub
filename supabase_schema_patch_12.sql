-- ============================================================
-- EAR ACADEMY — SCHEMA PATCH 12
-- Run after patch 11. Corrective + one-time backfill.
--
-- scorecard.reply_rate_90d is computed from touch_log.replied = true,
-- but nothing anywhere in the system ever set that column — touch_log
-- is insert-only (see its table comment), and neither handle_handover()
-- nor the Outlook reply-scan edge function ever updated an existing
-- row. Every touch_log row kept its default `false` forever, so the
-- metric was structurally pinned at 0% regardless of how many real
-- replies came in. The demo mock hand-fakes `replied: true` on seed
-- data, which is exactly why this was never caught locally.
--
-- Fix: handle_handover() (the RPC Badi's "Flag for Rus" confirmation
-- calls) now also marks the lead's most recent touch as replied. A
-- matching fix goes into the Outlook reply-scan edge function
-- separately (that's TypeScript, deployed independently — see
-- supabase/functions/outlook-reply-scan/index.ts).
--
-- Also backfills every already-recorded reply, so the metric reflects
-- reality immediately instead of only going forward.
-- ============================================================

create or replace function handle_handover(
  p_lead_id       uuid,
  p_triggered_by  uuid,
  p_demo_date     timestamptz default null,
  p_notes         text default null
)
returns void as $$
declare
  v_lead leads%rowtype;
begin
  -- Get current lead state
  select * into v_lead from leads where id = p_lead_id for update;

  if not found then
    raise exception 'Lead % not found', p_lead_id;
  end if;

  -- Record the handover event (this INSERT triggers the webhook → Resend email)
  insert into handover_events (
    lead_id, from_owner, to_owner, from_motion, to_motion,
    from_status, to_status, triggered_by, demo_date, notes
  ) values (
    p_lead_id,
    v_lead.owner,         -- coordinator
    'rus',
    v_lead.motion,        -- B
    'A',
    v_lead.status,        -- t1-sent / t2-sent / t3-sent
    'reply-received',
    p_triggered_by,
    p_demo_date,
    p_notes
  );

  -- Update the lead
  update leads set
    owner           = 'rus',
    motion          = 'A',
    status          = 'reply-received',
    demo_date       = p_demo_date,
    demo_booked_by  = 'coordinator',
    last_reply_date = current_date,
    first_reply_date = coalesce(v_lead.first_reply_date, current_date),
    updated_at      = now()
  where id = p_lead_id;

  -- Mark the touch that got the reply. touch_log stays insert-only for
  -- the send record itself (who sent what, when) — this only records
  -- the outcome on the most recent row for this lead.
  update touch_log
  set replied = true, reply_date = current_date
  where id = (
    select id from touch_log
    where lead_id = p_lead_id
    order by sent_date desc, created_at desc
    limit 1
  );

end;
$$ language plpgsql security definer;

comment on function handle_handover is 'Atomic handover: updates the lead, inserts a handover_events row, and marks the most recent touch_log row as replied — all in a single transaction. The handover_events INSERT triggers the Supabase webhook that calls the Resend Edge Function to email Rus.';

-- Backfill: every lead with an already-recorded reply gets its most
-- recent touch (on or before the reply date) marked as replied, so
-- reply_rate_90d reflects the replies Rus and Badi have already had.
update touch_log t
set replied = true, reply_date = l.last_reply_date
from leads l
where t.lead_id = l.id
  and l.last_reply_date is not null
  and t.id = (
    select id from touch_log t2
    where t2.lead_id = l.id and t2.sent_date <= l.last_reply_date
    order by t2.sent_date desc, t2.created_at desc
    limit 1
  );

-- Verify:
select count(*) filter (where replied) as replied_count, count(*) as total_count
from touch_log
where sent_date >= current_date - interval '90 days';
