import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReservationPayload = {
  spaceId: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount?: number;
  specialRequests?: string;
};

type MercadoPagoPreferenceResponse = {
  id: string;
  init_point: string;
  sandbox_init_point: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Metodo no permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "No autorizado" }, 401);

    const supabase = createClient(
      mustEnv("SUPABASE_URL"),
      mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const accessToken = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) return json({ error: "Token invalido" }, 401);

    const payload = await parsePayload(req);
    if (!payload.ok) return json({ error: payload.error }, 400);

    const {
      spaceId,
      date,
      startTime,
      endTime,
      guestCount = 1,
      specialRequests = "",
    } = payload.data;

    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id, host_id, title, status, price_per_hour, min_hours, max_guests")
      .eq("id", spaceId)
      .eq("status", "active")
      .single();

    if (spaceError || !space) return json({ error: "Espacio no encontrado o inactivo" }, 404);
    if (space.host_id === user.id) return json({ error: "No podes reservar tu propio espacio" }, 400);
    if (guestCount < 1 || guestCount > space.max_guests) {
      return json({ error: `La cantidad de personas debe estar entre 1 y ${space.max_guests}` }, 400);
    }

    const totalHours = calculateTotalHours(startTime, endTime);
    if (totalHours <= 0) return json({ error: "El horario seleccionado no es valido" }, 400);
    if (totalHours < space.min_hours) return json({ error: `Minimo ${space.min_hours} horas` }, 400);

    const pendingTtlMinutes = parseInt(Deno.env.get("BOOKING_PENDING_TTL_MINUTES") ?? "30", 10);
    const checkoutExpiresAt = new Date(Date.now() + pendingTtlMinutes * 60_000).toISOString();
    const nowIso = new Date().toISOString();

    await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: "rejected",
        payment_error: "checkout_expired",
        updated_at: nowIso,
      })
      .eq("space_id", spaceId)
      .eq("date", date)
      .lt("start_time", endTime)
      .gt("end_time", startTime)
      .eq("status", "pending")
      .lt("checkout_expires_at", nowIso);

    const { data: overlappingBooking } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("space_id", spaceId)
      .eq("date", date)
      .lt("start_time", endTime)
      .gt("end_time", startTime)
      .in("status", ["pending", "paid", "confirmed"])
      .maybeSingle();

    if (overlappingBooking) {
      return json({ error: "El horario ya no esta disponible" }, 409);
    }

    const takeRate = parseFloat(Deno.env.get("PAYMENTS_TAKE_RATE") ?? Deno.env.get("VITE_TAKE_RATE") ?? "0.15");
    const subtotal = Math.round(space.price_per_hour * totalHours);
    const platformFee = Math.round(subtotal * takeRate);
    const totalCharged = subtotal + platformFee;
    const hostPayout = subtotal - platformFee;

    const { data: guestProfile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        space_id: spaceId,
        guest_id: user.id,
        host_id: space.host_id,
        date,
        start_time: startTime,
        end_time: endTime,
        total_hours: totalHours,
        price_per_hour: space.price_per_hour,
        subtotal,
        platform_fee: platformFee,
        total_charged: totalCharged,
        host_payout: hostPayout,
        guest_count: guestCount,
        special_requests: specialRequests,
        status: "pending",
        payment_status: "pending",
        payment_provider: "mercadopago",
        checkout_expires_at: checkoutExpiresAt,
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      const isConflict = bookingError?.code === "23505";
      return json({ error: isConflict ? "La reserva se proceso en otra sesion" : "No se pudo crear la reserva" }, isConflict ? 409 : 500);
    }

    const mpAccessToken = mustEnv("MP_ACCESS_TOKEN");
    const webhookUrl = mustEnv("MP_WEBHOOK_URL");
    const appUrl = Deno.env.get("APP_URL") ?? Deno.env.get("VITE_APP_URL") ?? "http://localhost:5173";

    const mpPreferencePayload = {
      items: [
        {
          id: spaceId,
          title: `Reserva: ${space.title}`,
          description: `${date} - ${startTime}-${endTime} (${totalHours}h)`,
          quantity: 1,
          currency_id: "UYU",
          unit_price: totalCharged,
        },
      ],
      payer: {
        name: guestProfile?.full_name ?? "",
        email: user.email,
        phone: { number: normalizePhoneForMP(guestProfile?.phone ?? "") },
      },
      back_urls: {
        success: `${appUrl}/mis-reservas?payment=success&bookingId=${booking.id}`,
        failure: `${appUrl}/mis-reservas?payment=failure&bookingId=${booking.id}`,
        pending: `${appUrl}/mis-reservas?payment=pending&bookingId=${booking.id}`,
      },
      auto_return: "approved",
      notification_url: webhookUrl,
      external_reference: booking.id,
      metadata: {
        booking_id: booking.id,
        space_id: spaceId,
        host_id: space.host_id,
        guest_id: user.id,
      },
      expires: true,
      expiration_date_to: checkoutExpiresAt,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `booking-${booking.id}`,
      },
      body: JSON.stringify(mpPreferencePayload),
    });

    if (!mpResponse.ok) {
      const mpError = await safeJson(mpResponse);
      console.error("Error creando preferencia MP:", mpError);

      await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          payment_status: "rejected",
          payment_error: "mp_preference_create_failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      return json({ error: "No se pudo iniciar el checkout con Mercado Pago" }, 502);
    }

    const mpData = await mpResponse.json() as MercadoPagoPreferenceResponse;

    const { error: updateBookingError } = await supabase
      .from("bookings")
      .update({
        mp_preference_id: mpData.id,
        checkout_expires_at: checkoutExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    if (updateBookingError) {
      console.error("Error actualizando booking con preference_id:", updateBookingError);
      return json({ error: "No se pudo finalizar la preparacion del checkout" }, 500);
    }

    return json({
      bookingId: booking.id,
      preferenceId: mpData.id,
      initPoint: mpData.init_point,
      sandboxInitPoint: mpData.sandbox_init_point,
      expiresAt: checkoutExpiresAt,
    });
  } catch (err) {
    console.error("Error en mp-create-preference:", err);
    return json({ error: "Error interno del servidor" }, 500);
  }
});

async function parsePayload(req: Request): Promise<{ ok: true; data: ReservationPayload } | { ok: false; error: string }> {
  const body = await req.json().catch(() => null) as { bookingData?: ReservationPayload } | null;
  const bookingData = body?.bookingData;
  if (!bookingData) return { ok: false, error: "Payload invalido" };

  if (!bookingData.spaceId || !bookingData.date || !bookingData.startTime || !bookingData.endTime) {
    return { ok: false, error: "Faltan datos obligatorios de la reserva" };
  }

  if (!isDateString(bookingData.date)) return { ok: false, error: "La fecha debe tener formato YYYY-MM-DD" };
  if (!isTimeString(bookingData.startTime) || !isTimeString(bookingData.endTime)) {
    return { ok: false, error: "El horario debe tener formato HH:MM" };
  }

  return { ok: true, data: bookingData };
}

function calculateTotalHours(startTime: string, endTime: string): number {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const total = (end - start) / 60;
  return Math.round(total * 10) / 10;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizePhoneForMP(phone: string): string {
  return phone.replace(/[^\d]/g, "").replace(/^598/, "");
}

function mustEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return { message: "Unable to parse provider error response" };
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

