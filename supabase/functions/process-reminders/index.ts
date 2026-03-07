// supabase/functions/process-reminders/index.ts
// Procesa reminders pendientes de la tabla scheduled_reminders.
// Invocar con un cron cada 15 minutos (pg_cron o GitHub Actions):
//   curl -X POST https://<project>.supabase.co/functions/v1/process-reminders \
//     -H "Authorization: Bearer <service_role_key>" \
//     -H "x-payments-secret: <secret>"

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payments-secret",
};

const TRIGGER_MAP: Record<string, string> = {
  reminder_24h: "reminder_24h",
  reminder_2h: "reminder_2h",
  review_request: "review_request",
  payment_release: "payment_released",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // Auth: require service secret
  const secret = req.headers.get("x-payments-secret");
  if (secret !== Deno.env.get("PAYMENTS_SECRET")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch due reminders (scheduled_for <= now AND not sent)
  const { data: reminders, error } = await supabase
    .from("scheduled_reminders")
    .select("id, booking_id, trigger_type")
    .eq("sent", false)
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (error) {
    console.error("Error fetching reminders:", error);
    return json({ error: "Failed to fetch reminders" }, 500);
  }

  if (!reminders || reminders.length === 0) {
    return json({ processed: 0, message: "No pending reminders" });
  }

  let processed = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const trigger = TRIGGER_MAP[reminder.trigger_type];
    if (!trigger) {
      console.warn(`Unknown trigger type: ${reminder.trigger_type}`);
      continue;
    }

    try {
      // Call send-notifications function
      const notifUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notifications`;
      const res = await fetch(notifUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          bookingId: reminder.booking_id,
          trigger,
        }),
      });

      if (res.ok) {
        await supabase
          .from("scheduled_reminders")
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq("id", reminder.id);
        processed++;
      } else {
        const errBody = await res.text();
        await supabase
          .from("scheduled_reminders")
          .update({ error: errBody.slice(0, 500) })
          .eq("id", reminder.id);
        failed++;
        console.error(`Reminder ${reminder.id} failed:`, errBody);
      }
    } catch (err) {
      await supabase
        .from("scheduled_reminders")
        .update({ error: String(err).slice(0, 500) })
        .eq("id", reminder.id);
      failed++;
      console.error(`Reminder ${reminder.id} error:`, err);
    }
  }

  return json({ processed, failed, total: reminders.length });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
