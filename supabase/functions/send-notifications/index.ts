// supabase/functions/send-notifications/index.ts
// Orquesta todas las notificaciones de WhatsApp (360dialog) y email (Resend)
//
// POST /functions/v1/send-notifications
// Body: { bookingId: string, trigger: NotificationTrigger }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type NotificationTrigger =
  | "payment_approved"
  | "payment_refunded"
  | "payment_released"
  | "reminder_24h"
  | "reminder_2h"
  | "review_request"
  | "manual_payout_required";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { bookingId, trigger }: { bookingId: string; trigger: NotificationTrigger } =
      await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Obtener datos completos de la reserva ─────────────────
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        guest:profiles!guest_id ( full_name, phone ),
        host:profiles!host_id  ( full_name, phone ),
        space:spaces            ( title, address, neighborhood )
      `)
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return json({ error: "Booking no encontrado" }, 404);
    }

    // ── Despachar notificaciones según trigger ────────────────
    const results: Array<{ channel: string; template: string; status: string; error?: string }> = [];

    switch (trigger) {
      case "payment_approved":
        results.push(...await Promise.all([
          sendWhatsApp(booking.guest.phone, "booking_confirmed_guest", {
            guest_name:   booking.guest.full_name.split(" ")[0],
            space_title:  booking.space.title,
            date:         formatDate(booking.date),
            time:         `${booking.start_time}–${booking.end_time}`,
            address:      booking.space.address,
          }),
          sendWhatsApp(booking.host.phone, "new_booking_host", {
            host_name:    booking.host.full_name.split(" ")[0],
            space_title:  booking.space.title,
            date:         formatDate(booking.date),
            time:         `${booking.start_time}–${booking.end_time}`,
            guests:       String(booking.guest_count),
            payout:       `$U ${booking.host_payout.toLocaleString("es-UY")}`,
          }),
          sendEmail(supabase, booking, trigger),
        ]));
        // Programar recordatorios
        await scheduleReminders(supabase, bookingId, booking.date, booking.start_time);
        break;

      case "reminder_24h":
        results.push(await sendWhatsApp(booking.guest.phone, "reminder_24h", {
          guest_name:   booking.guest.full_name.split(" ")[0],
          space_title:  booking.space.title,
          date:         formatDate(booking.date),
          time:         booking.start_time,
          address:      booking.space.address,
        }));
        break;

      case "reminder_2h":
        results.push(await sendWhatsApp(booking.guest.phone, "reminder_2h", {
          guest_name:   booking.guest.full_name.split(" ")[0],
          space_title:  booking.space.title,
          time:         booking.start_time,
          address:      booking.space.address,
          special_instructions: booking.special_requests || "Ninguna",
        }));
        break;

      case "review_request":
        results.push(await sendWhatsApp(booking.guest.phone, "review_request", {
          guest_name:   booking.guest.full_name.split(" ")[0],
          space_title:  booking.space.title,
          review_url:   `${Deno.env.get("VITE_APP_URL")}/reservas/${bookingId}/reseña`,
        }));
        break;

      case "payment_released":
        results.push(...await Promise.all([
          sendWhatsApp(booking.host.phone, "payment_credited", {
            host_name:    booking.host.full_name.split(" ")[0],
            amount:       `$U ${booking.host_payout.toLocaleString("es-UY")}`,
            space_title:  booking.space.title,
            date:         formatDate(booking.date),
          }),
          // También solicitar reseña al guest
          sendWhatsApp(booking.guest.phone, "review_request", {
            guest_name:   booking.guest.full_name.split(" ")[0],
            space_title:  booking.space.title,
            review_url:   `${Deno.env.get("VITE_APP_URL")}/reservas/${bookingId}/reseña`,
          }),
        ]));
        break;

      case "payment_refunded":
        results.push(await sendWhatsApp(booking.guest.phone, "booking_refunded", {
          guest_name:   booking.guest.full_name.split(" ")[0],
          amount:       `$U ${booking.total_charged.toLocaleString("es-UY")}`,
          space_title:  booking.space.title,
        }));
        break;

      case "manual_payout_required":
        // Notificar al equipo interno de Prende
        results.push(await sendEmail(supabase, booking, trigger));
        break;
    }

    // ── Log de notificaciones ─────────────────────────────────
    await supabase.from("notification_log").insert(
      results.map(r => ({
        booking_id:   bookingId,
        channel:      r.channel,
        template:     r.template,
        status:       r.status,
        error:        r.error ?? null,
      }))
    );

    return json({ sent: results.length, results });

  } catch (err) {
    console.error("Error en send-notifications:", err);
    return json({ error: "Error enviando notificaciones" }, 500);
  }
});

// ─── WHATSAPP VIA 360DIALOG ──────────────────────────────────

async function sendWhatsApp(
  phone: string | null,
  templateName: string,
  params: Record<string, string>
): Promise<{ channel: string; template: string; status: string; error?: string }> {
  const result = { channel: "whatsapp", template: templateName, status: "sent" };

  if (!phone) {
    return { ...result, status: "skipped", error: "No hay número de teléfono" };
  }

  const waApiKey       = Deno.env.get("WA_API_KEY")!;
  const waPhoneNumberId = Deno.env.get("WA_PHONE_NUMBER_ID")!;

  // Normalizar teléfono uruguayo: +598XXXXXXXX
  const normalizedPhone = phone.startsWith("+") ? phone : `+598${phone}`;

  const payload = {
    messaging_product: "whatsapp",
    to:                normalizedPhone.replace("+", ""),
    type:              "template",
    template: {
      name:     templateName,
      language: { code: "es_AR" },    // español rioplatense
      components: [
        {
          type:       "body",
          parameters: Object.values(params).map(value => ({ type: "text", text: value })),
        },
      ],
    },
  };

  try {
    const response = await fetch(
      `https://waba.360dialog.io/v1/messages`,
      {
        method:  "POST",
        headers: {
          "D360-API-KEY": waApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error(`WA error para ${templateName}:`, err);
      // FALLBACK: el email se envía siempre como respaldo
      return { ...result, status: "failed", error: JSON.stringify(err) };
    }

    const data = await response.json();
    return { ...result, status: "sent" };

  } catch (err) {
    console.error("Error enviando WhatsApp:", err);
    return { ...result, status: "failed", error: String(err) };
  }
}

// ─── EMAIL VIA RESEND ────────────────────────────────────────

async function sendEmail(
  supabase: ReturnType<typeof createClient>,
  booking: Record<string, unknown>,
  trigger: string
): Promise<{ channel: string; template: string; status: string; error?: string }> {
  const result = { channel: "email", template: trigger, status: "sent" };
  const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
  const fromEmail    = Deno.env.get("RESEND_FROM_EMAIL") ?? "reservas@prende.uy";

  // Obtener email del guest
  const { data: guestAuth } = await supabase.auth.admin.getUserById(
    booking.guest_id as string
  );
  const guestEmail = guestAuth.user?.email;

  if (!guestEmail) return { ...result, status: "skipped", error: "Sin email" };

  const emailTemplates: Record<string, { subject: string; html: string }> = {
    payment_approved: {
      subject: `🔥 Reserva confirmada: ${(booking.space as Record<string, unknown>).title}`,
      html: buildBookingConfirmationEmail(booking),
    },
    payment_refunded: {
      subject: `Reembolso procesado: ${(booking.space as Record<string, unknown>).title}`,
      html: buildRefundEmail(booking),
    },
    manual_payout_required: {
      subject: `⚠️ Pago manual requerido: Booking ${booking.id}`,
      html: `<p>El booking ${booking.id} necesita liquidación manual. El host no tiene cuenta MP.</p>`,
    },
  };

  const template = emailTemplates[trigger];
  if (!template) return { ...result, status: "skipped" };

  // Para liquidación manual, notificar a Prende no al guest
  const recipient = trigger === "manual_payout_required"
    ? "pagos@prende.uy"
    : guestEmail;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    fromEmail,
        to:      recipient,
        subject: template.subject,
        html:    template.html,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return { ...result, status: "failed", error: JSON.stringify(err) };
    }

    return result;
  } catch (err) {
    return { ...result, status: "failed", error: String(err) };
  }
}

// ─── RECORDATORIOS PROGRAMADOS ───────────────────────────────

async function scheduleReminders(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  date: string,
  startTime: string
) {
  const eventDatetime = new Date(`${date}T${startTime}`);

  const reminder24h = new Date(eventDatetime);
  reminder24h.setHours(reminder24h.getHours() - 24);

  const reminder2h = new Date(eventDatetime);
  reminder2h.setHours(reminder2h.getHours() - 2);

  const reviewTime = new Date(eventDatetime);
  reviewTime.setHours(reviewTime.getHours() + 24);

  const releaseDelay = parseInt(Deno.env.get("PAYMENT_RELEASE_DELAY_DAYS") ?? "1");
  const releaseTime = new Date(eventDatetime);
  releaseTime.setDate(releaseTime.getDate() + releaseDelay);

  const now = new Date();
  const reminders = [
    { booking_id: bookingId, trigger_type: "reminder_24h", scheduled_for: reminder24h.toISOString() },
    { booking_id: bookingId, trigger_type: "reminder_2h", scheduled_for: reminder2h.toISOString() },
    { booking_id: bookingId, trigger_type: "review_request", scheduled_for: reviewTime.toISOString() },
    { booking_id: bookingId, trigger_type: "payment_release", scheduled_for: releaseTime.toISOString() },
  ].filter((r) => new Date(r.scheduled_for) > now);

  if (reminders.length === 0) return;

  const { error } = await supabase
    .from("scheduled_reminders")
    .upsert(reminders, { onConflict: "booking_id,trigger_type" });

  if (error) {
    console.error("Error programando reminders:", error);
  } else {
    console.log(`${reminders.length} recordatorios programados para booking ${bookingId}`);
  }
}

// ─── EMAIL TEMPLATES (HTML INLINE) ──────────────────────────

function buildBookingConfirmationEmail(booking: Record<string, unknown>): string {
  const space   = booking.space as Record<string, unknown>;
  const guest   = booking.guest as Record<string, unknown>;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, sans-serif; background: #0D0A07; color: #F5ECD7; padding: 40px 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #1a1410; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #FF7820, #FFB347); padding: 32px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 8px;">🔥</div>
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 800;">¡Reserva confirmada!</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #ccc; margin: 0 0 24px;">Hola ${String(guest.full_name).split(" ")[0]},</p>
      <div style="background: rgba(255,120,30,0.1); border: 1px solid rgba(255,120,30,0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px; color: #FF7820; font-size: 18px;">${String(space.title)}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">📅 Fecha</td><td style="color: #F5ECD7; font-size: 13px; text-align: right;">${formatDate(booking.date as string)}</td></tr>
          <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">⏰ Horario</td><td style="color: #F5ECD7; font-size: 13px; text-align: right;">${String(booking.start_time)} – ${String(booking.end_time)}</td></tr>
          <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">📍 Dirección</td><td style="color: #F5ECD7; font-size: 13px; text-align: right;">${String(space.address)}</td></tr>
          <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">💰 Total pagado</td><td style="color: #FF7820; font-size: 13px; font-weight: 700; text-align: right;">$U ${Number(booking.total_charged).toLocaleString("es-UY")}</td></tr>
        </table>
      </div>
      <p style="color: #888; font-size: 12px; line-height: 1.6; margin: 0;">
        Recibirás un recordatorio 24 horas antes y otro 2 horas antes con los datos de acceso.<br>
        ¿Necesitás cancelar? Tenés hasta 24 horas antes del evento para un reembolso completo.
      </p>
    </div>
    <div style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.07); text-align: center;">
      <p style="color: #444; font-size: 11px; margin: 0;">Prende · Montevideo, Uruguay · reservas@prende.uy</p>
    </div>
  </div>
</body>
</html>`;
}

function buildRefundEmail(booking: Record<string, unknown>): string {
  const space = booking.space as Record<string, unknown>;
  const guest = booking.guest as Record<string, unknown>;
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background: #0D0A07; color: #F5ECD7; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #1a1410; border-radius: 16px; padding: 32px;">
    <h1>Reembolso procesado</h1>
    <p>Hola ${String(guest.full_name).split(" ")[0]},</p>
    <p>Tu reserva en <strong>${String(space.title)}</strong> fue cancelada y se procesó el reembolso de <strong>$U ${Number(booking.total_charged).toLocaleString("es-UY")}</strong>.</p>
    <p style="color: #888; font-size: 12px;">El reembolso aparecerá en tu cuenta en 3-7 días hábiles según tu banco.</p>
  </div>
</body>
</html>`;
}

// ─── UTILS ──────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-UY", {
    weekday: "long", day: "numeric", month: "long"
  });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
