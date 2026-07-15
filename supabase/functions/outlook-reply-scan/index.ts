// ============================================================
// EAR ACADEMY — OUTLOOK REPLY-DETECTION SCAN
// File: supabase/functions/outlook-reply-scan/index.ts
//
// Runs twice daily (08:00 and 18:00 SAST — 06:00 and 16:00 UTC) via
// pg_cron. Scans Rus's and the coordinator's Outlook inboxes for mail
// received since the last scan; any sender that matches a lead's
// contact_email moves that lead to reply-received, so Badi never has
// to log a reply by hand.
//
// AUTH MODEL — read this before configuring:
// This calls Microsoft Graph with client-credentials (app-only) auth,
// NOT the delegated (signed-in-user) auth a personal Outlook
// connection normally uses. Delegated auth is tied to one person's
// interactive session and can't be used from an unattended scheduled
// job to read a DIFFERENT mailbox (Badi's) without her personally
// signing in. App-only auth needs an Azure AD app registration with
// Mail.Read APPLICATION permission (not delegated), admin-consented,
// granted access to both mailboxes.
//
// Because there's no signed-in user in app-only auth, Graph calls
// must target a specific mailbox via /users/{email}/... — the
// delegated-style /me/... endpoint the original spec named doesn't
// work here at all (there's no "me").
//
// SETUP:
// 1. In Azure AD (Entra ID): register an app, add Microsoft Graph
//    Application permission "Mail.Read", grant admin consent.
// 2. supabase functions deploy outlook-reply-scan
// 3. supabase secrets set \
//      MICROSOFT_TENANT_ID=<tenant id> \
//      MICROSOFT_CLIENT_ID=<app client id> \
//      MICROSOFT_CLIENT_SECRET=<client secret> \
//      RUS_EMAIL=rus@the-ear.com \
//      BADI_EMAIL=badikazi@the-ear.com \
//      CRON_SECRET=<a random string>
// 4. Do one manual test call (see README) before enabling the cron
//    schedule — see supabase_schema_patch_3.sql for why the schedule
//    isn't created automatically.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

const MICROSOFT_TENANT_ID = Deno.env.get("MICROSOFT_TENANT_ID")!;
const MICROSOFT_CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID")!;
const MICROSOFT_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET")!;
const RUS_EMAIL = Deno.env.get("RUS_EMAIL") ?? "rus@the-ear.com";
const BADI_EMAIL = Deno.env.get("BADI_EMAIL") ?? "badikazi@the-ear.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CONFIG_KEY = "outlook_last_scan_at";
const REPLYABLE_STATUSES = ["t1-sent", "t2-sent", "t3-sent"];

interface GraphMessage {
  from?: { emailAddress?: { address?: string } };
  receivedDateTime?: string;
  subject?: string;
}

async function getGraphToken(): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Graph token request failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.access_token as string;
}

// App-only calls have no signed-in user, so /me doesn't exist — the
// mailbox must be addressed explicitly via /users/{email}.
async function fetchMessagesSince(
  token: string,
  mailboxEmail: string,
  sinceIso: string,
): Promise<GraphMessage[]> {
  const messages: GraphMessage[] = [];
  const filter = `receivedDateTime ge ${sinceIso}`;
  let url =
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxEmail)}` +
    `/mailFolders/inbox/messages?$filter=${encodeURIComponent(filter)}` +
    `&$select=from,receivedDateTime,subject&$top=50`;

  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      throw new Error(`Graph messages request failed for ${mailboxEmail}: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    messages.push(...(json.value ?? []));
    url = json["@odata.nextLink"] ?? "";
  }
  return messages;
}

async function getLastScanTime(): Promise<string> {
  const { data } = await supabase.from("app_config").select("value").eq("key", CONFIG_KEY).maybeSingle();
  // First-ever run: default to 24h ago rather than scanning full mailbox history.
  return data?.value ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

async function setLastScanTime(iso: string) {
  await supabase
    .from("app_config")
    .upsert({ key: CONFIG_KEY, value: iso, updated_at: new Date().toISOString() });
}

async function logReply(fields: {
  mailbox: string;
  leadId: string | null;
  fromEmail: string;
  subject: string | null;
  receivedAt: string | null;
  action: string;
  detail?: string;
}) {
  try {
    await supabase.from("outlook_reply_log").insert({
      mailbox: fields.mailbox,
      lead_id: fields.leadId,
      from_email: fields.fromEmail,
      subject: fields.subject,
      received_at: fields.receivedAt,
      action: fields.action,
      detail: fields.detail ?? null,
    });
  } catch (err) {
    console.error("Failed to write outlook_reply_log:", err);
  }
}

// Processes one mailbox in isolation so one mailbox's failure (e.g. a
// permissions issue on just that account) doesn't block the other.
async function processMailbox(
  token: string,
  mailboxLabel: string,
  mailboxEmail: string,
  sinceIso: string,
): Promise<void> {
  const messages = await fetchMessagesSince(token, mailboxEmail, sinceIso);

  for (const message of messages) {
    const fromEmail = message.from?.emailAddress?.address;
    if (!fromEmail) continue;

    // find_lead_by_email is declared RETURNS SETOF leads (not a bare
    // composite) specifically so a non-match comes back as an empty
    // array over PostgREST. A bare-composite RETURNS leads function
    // still yields one row of all-NULL fields when its internal query
    // matches nothing — an object that's truthy in JS — which silently
    // defeated the `if (!lead) continue` check below.
    const { data: leads, error } = await supabase.rpc("find_lead_by_email", { p_email: fromEmail });
    if (error) {
      console.error(`Lookup failed for ${fromEmail}:`, error);
      continue;
    }
    const lead = leads?.[0];
    if (!lead) continue; // no matching lead — skip silently, per spec

    const today = new Date().toISOString().slice(0, 10);

    if (REPLYABLE_STATUSES.includes(lead.status)) {
      const { error: updateError } = await supabase
        .from("leads")
        .update({ status: "reply-received", last_reply_date: today })
        .eq("id", lead.id);
      if (updateError) {
        console.error(`Update failed for lead ${lead.id}:`, updateError);
        continue;
      }
      // Set once, never overwritten on subsequent replies.
      await supabase.from("leads").update({ first_reply_date: today }).eq("id", lead.id).is("first_reply_date", null);

      await logReply({
        mailbox: mailboxLabel,
        leadId: lead.id,
        fromEmail,
        subject: message.subject ?? null,
        receivedAt: message.receivedDateTime ?? null,
        action: "status_updated",
        detail: `Status moved to reply-received (was ${lead.status})`,
      });
    } else {
      // Already reply-received or beyond — don't downgrade, just record it happened.
      await logReply({
        mailbox: mailboxLabel,
        leadId: lead.id,
        fromEmail,
        subject: message.subject ?? null,
        receivedAt: message.receivedDateTime ?? null,
        action: "further_reply",
        detail: `Additional reply received while lead was already at status "${lead.status}"`,
      });
    }
  }
}

serve(async (req) => {
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const scanStartedAt = new Date().toISOString();
  const sinceIso = await getLastScanTime();

  let token: string;
  try {
    token = await getGraphToken();
  } catch (err) {
    console.error("outlook-reply-scan: token error:", err);
    return new Response(`Error: ${err}`, { status: 500 });
  }

  const results = await Promise.allSettled([
    processMailbox(token, "rus", RUS_EMAIL, sinceIso),
    processMailbox(token, "coordinator", BADI_EMAIL, sinceIso),
  ]);

  const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  for (const failure of failures) {
    console.error("outlook-reply-scan: mailbox scan failed:", failure.reason);
    await logReply({
      mailbox: "unknown",
      leadId: null,
      fromEmail: "(system)",
      subject: null,
      receivedAt: null,
      action: "error",
      detail: `${failure.reason}`,
    });
  }

  // Only advance the watermark if every mailbox scan succeeded — a
  // partial failure retries the whole window next run rather than
  // silently skipping the mail that failed to fetch.
  if (failures.length === 0) {
    await setLastScanTime(scanStartedAt);
  }

  return new Response(failures.length === 0 ? "OK" : "Partial failure — see outlook_reply_log", {
    status: failures.length === 0 ? 200 : 500,
  });
});
