// supabase/functions/mp-create-preference/index.ts
// Edge Function: crea una preferencia de pago en MercadoPago
// Llamada desde el frontend cuando el guest hace click en "Reservar"
//
// POST /functions/v1/mp-create-preference
// Body: { bookingData: { spaceId, date, startTime, endTime, guestCount } }
// Returns: { preferenceId, initPoint }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    // ── 1. Autenticación del guest ─────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "No autorizado" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return json({ error: "Token inválido" }, 401);

    // ── 2. Validar payload ─────────────────────────────────────
    const { bookingData } = await req.json();
    const { spaceId, date, startTime, endTime, guestCount, specialRequests } = bookingData;

    if (!spaceId || !date || !startTime || !endTime) {
      return json({ error: "Faltan datos de la reserva" }, 400);
    }

    // ── 3. Obtener datos del espacio y host ───────────────────
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("*, profiles!host_id(full_name, phone)")
      .eq("id", spaceId)
      .eq("status", "active")
      .single();

    if (spaceError || !space) {
      return json({ error: "Espacio no encontrado o no disponible" }, 404);
    }

    // ── 4. Verificar disponibilidad ───────────────────────────
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("space_id", spaceId)
      .eq("date", date)
      .in("status", ["paid", "confirmed"])
      .maybeSingle();

    if (existingBooking) {
      return json({ error: "El espacio ya está reservado para esa fecha" }, 409);
    }

    // ── 5. Calcular montos ────────────────────────────────────
    const TAKE_RATE = parseFloat(Deno.env.get("VITE_TAKE_RATE") ?? "0.15");

    // Calcular horas
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const totalHours = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;

    if (totalHours < space.min_hours) {
      return json({ error: `Mínimo ${space.min_hours} horas por reserva` }, 400);
    }

    const subtotal      = Math.round(space.price_per_hour * totalHours);
    const platformFee   = Math.round(subtotal * TAKE_RATE);
    const totalCharged  = subtotal + platformFee;
    const hostPayout    = subtotal - Math.round(subtotal * TAKE_RATE); // 85% del subtotal

    // ── 6. Obtener perfil del guest ───────────────────────────
    const { data: guestProfile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    // ── 7. Crear preferencia en MercadoPago ──────────────────
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN")!;
    const webhookUrl    = Deno.env.get("MP_WEBHOOK_URL")!;
    const appUrl        = Deno.env.get("VITE_APP_URL")!;

    const preference = {
      items: [
        {
          id: spaceId,
          title: `Reserva: ${space.title}`,
          description: `${date} · ${startTime}–${endTime} · ${totalHours}h`,
          quantity: 1,
          currency_id: "UYU",
          unit_price: totalCharged,
        },
      ],
      payer: {
        name: guestProfile?.full_name ?? "",
        email: user.email,
        phone: { number: guestProfile?.phone?.replace("+598", "") ?? "" },
      },
      back_urls: {
        success: `${appUrl}/reservas/exito`,
        failure: `${appUrl}/reservas/error`,
        pending: `${appUrl}/reservas/pendiente`,
      },
      auto_return: "approved",
      notification_url: webhookUrl,
      external_reference: JSON.stringify({
        // Pasamos todos los datos para reconstruir la reserva en el webhook
        guestId:        user.id,
        hostId:         space.host_id,
        spaceId,
        date,
        startTime,
        endTime,
        totalHours,
        guestCount:     guestCount ?? 1,
        specialRequests: specialRequests ?? "",
        pricePerHour:   space.price_per_hour,
        subtotal,
        platformFee,
        totalCharged,
        hostPayout,
      }),
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${user.id}-${spaceId}-${date}-${startTime}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const mpError = await mpResponse.json();
      console.error("MP error:", JSON.stringify(mpError));
      return json({ error: "Error al crear preferencia de pago" }, 500);
    }

    const mpData = await mpResponse.json();

    // ── 8. Guardar preferencia en DB (estado pending) ─────────
    await supabase.from("bookings").insert({
      space_id:         spaceId,
      guest_id:         user.id,
      host_id:          space.host_id,
      date,
      start_time:       startTime,
      end_time:         endTime,
      total_hours:      totalHours,
      price_per_hour:   space.price_per_hour,
      subtotal,
      platform_fee:     platformFee,
      total_charged:    totalCharged,
      host_payout:      hostPayout,
      guest_count:      guestCount ?? 1,
      special_requests: specialRequests ?? "",
      mp_preference_id: mpData.id,
      status:           "pending",
      payment_status:   "pending",
    });

    return json({
      preferenceId: mpData.id,
      initPoint:    mpData.init_point,     // URL de pago MP (producción)
      sandboxInitPoint: mpData.sandbox_init_point, // URL de sandbox para tests
    });

  } catch (err) {
    console.error("Error en mp-create-preference:", err);
    return json({ error: "Error interno del servidor" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
