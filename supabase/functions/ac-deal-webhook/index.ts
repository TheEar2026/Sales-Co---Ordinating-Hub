// ============================================================
// EAR ACADEMY — ACTIVECAMPAIGN DEAL WEBHOOK
// File: supabase/functions/ac-deal-webhook/index.ts
//
// Triggered by an ActiveCampaign webhook (Settings → Developer →
// Webhooks) on the "Deal Updated" event. Keeps Supabase leads in
// sync with deal stage changes in AC Pipeline 5 ("Sales Conversion")
// so nobody has to update the dashboard by hand.
//
// AC's webhook UI only accepts a target URL (no custom headers), so
// the shared secret is passed as a query parameter on that URL:
//   https://<project-ref>.functions.supabase.co/ac-deal-webhook?secret=<AC_WEBHOOK_SECRET>
//
// SETUP:
// 1. supabase functions deploy ac-deal-webhook
// 2. supabase secrets set AC_WEBHOOK_SECRET=<a random string>
// 3. In ActiveCampaign: Settings → Developer → Webhooks → Add webhook
//    - Event: Deal Updated
//    - URL: the function URL above, with ?secret=<same value>
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AC_WEBHOOK_SECRET = Deno.env.get("AC_WEBHOOK_SECRET")!;

// ActiveCampaign pipeline (dealGroup) ID for "Sales Conversion" —
// confirmed against the live AC account. Override via the
// AC_PIPELINE_ID secret if this ever changes.
const AC_PIPELINE_ID = Deno.env.get("AC_PIPELINE_ID") ?? "5";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// AC stage ID -> Supabase lead fields, confirmed against the live
// pipeline: 43 Demo/Pilot, 46 Negotiation, 47 Agreed, 48 Won, 49 Lost.
// Won/Lost are stages within the same pipeline in this AC account,
// not a separate status code, so stage id alone is the source of
// truth. Lost intentionally leaves motion/owner untouched.
const STAGE_MAP: Record<string, { status: string; motion?: string; owner?: string }> = {
  "43": { status: "demo-held", motion: "A", owner: "rus" },
  "46": { status: "negotiation", motion: "A", owner: "rus" },
  "47": { status: "close", motion: "A", owner: "rus" },
  "48": { status: "won", motion: "A", owner: "rus" },
  "49": { status: "lost" },
};

interface ParsedDeal {
  dealId: string | null;
  pipelineId: string | null;
  stageId: string | null;
  valueCents: string | null;
  currency: string | null;
  title: string | null;
  contactEmail: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  organizationName: string | null;
}

// AC's classic webhooks POST `application/x-www-form-urlencoded` with
// bracket-notation keys (deal[id], contact[email], ...). Some relays
// (Zapier, a custom proxy) send JSON instead — handle both.
function parsePayload(raw: string, contentType: string): Record<string, any> {
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      // fall through to form parsing
    }
  }

  const params = new URLSearchParams(raw);
  const result: Record<string, any> = {};
  for (const [key, value] of params.entries()) {
    const match = key.match(/^([^\[]+)\[([^\]]+)\]$/);
    if (match) {
      const [, group, field] = match;
      result[group] = result[group] ?? {};
      result[group][field] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function extractDeal(payload: Record<string, any>): ParsedDeal {
  const deal = payload.deal ?? {};
  const contact = payload.contact ?? {};
  const organization = payload.organization ?? {};

  return {
    dealId: deal.id ?? null,
    pipelineId: deal.group ?? deal.pipeline ?? null,
    stageId: deal.stage ?? null,
    valueCents: deal.value ?? null,
    currency: deal.currency ?? null,
    title: deal.title ?? null,
    contactEmail: contact.email ?? null,
    contactFirstName: contact.first_name ?? null,
    contactLastName: contact.last_name ?? null,
    organizationName: organization.name ?? null,
  };
}

async function logEvent(fields: {
  dealId: string | null;
  pipelineId: string | null;
  stageId: string | null;
  statusSet: string | null;
  action: string;
  detail?: string;
  rawPayload: unknown;
}) {
  try {
    await supabase.from("webhook_log").insert({
      source: "activecampaign",
      deal_id: fields.dealId,
      pipeline_id: fields.pipelineId,
      stage_received: fields.stageId,
      status_set: fields.statusSet,
      action: fields.action,
      detail: fields.detail ?? null,
      raw_payload: fields.rawPayload,
    });
  } catch (err) {
    console.error("Failed to write webhook_log:", err);
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== AC_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const raw = await req.text();
  const contentType = req.headers.get("content-type") ?? "";
  let payload: Record<string, any>;

  try {
    payload = parsePayload(raw, contentType);
  } catch (err) {
    console.error("Failed to parse AC webhook payload:", err);
    await logEvent({
      dealId: null,
      pipelineId: null,
      stageId: null,
      statusSet: null,
      action: "error",
      detail: `Payload parse failure: ${err}`,
      rawPayload: raw,
    });
    return new Response("OK", { status: 200 });
  }

  const deal = extractDeal(payload);

  if (!deal.dealId) {
    await logEvent({
      dealId: null,
      pipelineId: deal.pipelineId,
      stageId: deal.stageId,
      statusSet: null,
      action: "error",
      detail: "No deal.id in payload",
      rawPayload: payload,
    });
    return new Response("OK", { status: 200 });
  }

  if (deal.pipelineId !== AC_PIPELINE_ID) {
    await logEvent({
      dealId: deal.dealId,
      pipelineId: deal.pipelineId,
      stageId: deal.stageId,
      statusSet: null,
      action: "ignored",
      detail: `Pipeline ${deal.pipelineId} is not the Sales Conversion pipeline (${AC_PIPELINE_ID})`,
      rawPayload: payload,
    });
    return new Response("OK", { status: 200 });
  }

  const mapping = deal.stageId ? STAGE_MAP[deal.stageId] : undefined;
  if (!mapping) {
    await logEvent({
      dealId: deal.dealId,
      pipelineId: deal.pipelineId,
      stageId: deal.stageId,
      statusSet: null,
      action: "ignored",
      detail: `Stage ${deal.stageId} has no mapping — lead left unchanged`,
      rawPayload: payload,
    });
    return new Response("OK", { status: 200 });
  }

  const dealIdNum = Number(deal.dealId);
  if (!Number.isInteger(dealIdNum)) {
    await logEvent({
      dealId: deal.dealId,
      pipelineId: deal.pipelineId,
      stageId: deal.stageId,
      statusSet: mapping.status,
      action: "error",
      detail: `deal.id "${deal.dealId}" is not a valid integer`,
      rawPayload: payload,
    });
    return new Response("OK", { status: 200 });
  }

  const update: Record<string, unknown> = { status: mapping.status };
  if (mapping.motion) update.motion = mapping.motion;
  if (mapping.owner) update.owner = mapping.owner;

  if (deal.valueCents != null) {
    const valueUnits = Number(deal.valueCents) / 100;
    if (Number.isFinite(valueUnits)) update.ac_deal_value = valueUnits;
  }
  if (deal.currency) update.ac_deal_currency = deal.currency.toUpperCase();

  try {
    const { data: existing, error: findError } = await supabase
      .from("leads")
      .select("id")
      .eq("ac_deal_id", dealIdNum)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const { error: updateError } = await supabase
        .from("leads")
        .update(update)
        .eq("id", existing.id);
      if (updateError) throw updateError;

      await logEvent({
        dealId: deal.dealId,
        pipelineId: deal.pipelineId,
        stageId: deal.stageId,
        statusSet: mapping.status,
        action: "updated",
        detail: `Updated lead ${existing.id}`,
        rawPayload: payload,
      });
    } else {
      const contactName =
        [deal.contactFirstName, deal.contactLastName].filter(Boolean).join(" ") ||
        `Unknown contact (AC deal #${deal.dealId})`;
      const schoolName = deal.organizationName || deal.title || `Unknown school (AC deal #${deal.dealId})`;

      const { data: created, error: insertError } = await supabase
        .from("leads")
        .insert({
          contact_name: contactName,
          contact_email: deal.contactEmail,
          school_name: schoolName,
          ac_deal_id: dealIdNum,
          source: "activecampaign",
          needs_review: true,
          review_reason: `Auto-created from AC deal #${deal.dealId} — no matching ac_deal_id found in Supabase. Verify contact and school details.`,
          ...update,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      await logEvent({
        dealId: deal.dealId,
        pipelineId: deal.pipelineId,
        stageId: deal.stageId,
        statusSet: mapping.status,
        action: "created",
        detail: `Created lead ${created.id} — flagged for review`,
        rawPayload: payload,
      });
    }
  } catch (err) {
    console.error("ac-deal-webhook error:", err);
    await logEvent({
      dealId: deal.dealId,
      pipelineId: deal.pipelineId,
      stageId: deal.stageId,
      statusSet: mapping.status,
      action: "error",
      detail: `${err}`,
      rawPayload: payload,
    });
  }

  return new Response("OK", { status: 200 });
});
