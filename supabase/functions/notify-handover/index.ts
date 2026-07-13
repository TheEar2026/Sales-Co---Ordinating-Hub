// ============================================================
// EAR ACADEMY — SUPABASE EDGE FUNCTION
// File: supabase/functions/notify-handover/index.ts
//
// This function is triggered by a Supabase Database Webhook
// whenever a new row is inserted into the handover_events table.
//
// It sends a plain-text notification email to Rus via Resend.
//
// SETUP INSTRUCTIONS (after deploying):
// 1. Go to Supabase Dashboard → Database → Webhooks
// 2. Create a new webhook:
//    - Name: notify-handover
//    - Table: handover_events
//    - Events: INSERT only
//    - Type: Edge Function
//    - Edge Function: notify-handover
// 3. Add the RESEND_API_KEY to Supabase secrets:
//    supabase secrets set RESEND_API_KEY=<<RESEND_API_KEY>>
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RUS_EMAIL       = "rus@the-ear.com";
const FROM_EMAIL      = "sales@the-ear.com";

serve(async (req) => {
  try {
    // Supabase webhooks send a POST with the row data as JSON
    const payload = await req.json();

    // The webhook payload contains the new row from handover_events
    const event = payload.record;

    if (!event || !event.lead_id) {
      return new Response("No event data", { status: 400 });
    }

    // Fetch the lead details so we can include them in the email
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: lead, error } = await supabase
      .from("leads")
      .select("contact_name, school_name, contact_email, demo_date, notes")
      .eq("id", event.lead_id)
      .single();

    if (error || !lead) {
      console.error("Failed to fetch lead:", error);
      return new Response("Lead not found", { status: 404 });
    }

    // Format the demo date if it exists
    const demoDateStr = event.demo_date
      ? new Date(event.demo_date).toLocaleString("en-ZA", {
          timeZone: "Africa/Johannesburg",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Not yet scheduled — coordinate with the coordinator";

    // Build the email
    const emailBody = `
Interested reply received — action required

Contact:   ${lead.contact_name}
School:    ${lead.school_name}
Email:     ${lead.contact_email || "See dashboard"}
Demo:      ${demoDateStr}

This lead has moved from the coordinator's Motion B queue to your Motion A list.

${event.notes ? `Coordinator note: ${event.notes}` : ""}

Open Motion A in the dashboard to see the full history and next action.

---
Sent automatically by the Ear Academy Sales System.
    `.trim();

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: RUS_EMAIL,
        subject: `Interested reply — ${lead.contact_name} at ${lead.school_name}`,
        text: emailBody,
      }),
    });

    if (!resendResponse.ok) {
      const err = await resendResponse.text();
      console.error("Resend error:", err);

      // Mark the notification as failed in the database
      await supabase
        .from("handover_events")
        .update({ notification_sent: false })
        .eq("id", event.id);

      return new Response("Email send failed", { status: 500 });
    }

    // Mark the notification as sent
    await supabase
      .from("handover_events")
      .update({
        notification_sent: true,
        notification_sent_at: new Date().toISOString(),
      })
      .eq("id", event.id);

    console.log(`Handover notification sent for lead ${event.lead_id}`);
    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
