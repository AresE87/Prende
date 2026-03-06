// src/lib/supabase.ts
// Cliente Supabase tipado para el frontend
// Importar este archivo en lugar de crear instancias directas

import { createClient } from "@supabase/supabase-js";

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ TIPOS DE BASE DE DATOS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Generados con: supabase gen types typescript --project-id TU_ID > src/lib/database.types.ts
// Por ahora los definimos manualmente hasta que el schema estÃƒÂ© estable

export type SpaceStatus   = "draft" | "active" | "paused" | "deleted";
export type BookingStatus = "pending" | "paid" | "confirmed" | "completed" | "cancelled" | "refunded";
export type PaymentStatus = "pending" | "approved" | "rejected" | "refunded" | "in_mediation" | "released";
export type FuelType      = "carbon" | "lena" | "gas" | "electrica";

export interface Profile {
  id:               string;
  full_name:        string;
  phone:            string | null;
  avatar_url:       string | null;
  cedula:           string | null;
  cedula_verified:  boolean;
  mp_account_id:    string | null;
  is_host:          boolean;
  created_at:       string;
  updated_at:       string;
}

export interface Space {
  id:               string;
  host_id:          string;
  title:            string;
  description:      string | null;
  status:           SpaceStatus;
  address:          string;
  neighborhood:     string | null;
  city:             string;
  lat:              number;
  lng:              number;
  max_guests:       number;
  min_hours:        number;
  price_per_hour:   number;          // UYU
  has_grill:        boolean;
  fuel_type:        FuelType;
  has_fire_extinguisher: boolean;
  grill_verified:   boolean;
  amenities:        string[];
  photos:           string[];
  house_rules:      string | null;
  allows_alcohol:   boolean;
  allows_music:     boolean;
  instant_booking:  boolean;
  rating_avg:       number;
  rating_count:     number;
  is_condo:         boolean;
  condo_allows_commercial: boolean | null;
  created_at:       string;
  updated_at:       string;
}

export interface Booking {
  id:                   string;
  space_id:             string;
  guest_id:             string;
  host_id:              string;
  date:                 string;       // YYYY-MM-DD
  start_time:           string;       // HH:MM
  end_time:             string;       // HH:MM
  total_hours:          number;
  price_per_hour:       number;
  subtotal:             number;
  platform_fee:         number;
  total_charged:        number;
  host_payout:          number;
  status:               BookingStatus;
  guest_count:          number;
  special_requests:     string | null;
  payment_provider:     string;
  checkout_token:       string | null;
  checkout_expires_at:  string | null;
  mp_preference_id:     string | null;
  mp_payment_id:        string | null;
  mp_merchant_order_id: string | null;
  mp_disbursement_id:   string | null;
  payment_status:       PaymentStatus;
  payment_method_id:    string | null;
  payment_method_type:  string | null;
  payment_metadata:     Record<string, unknown> | null;
  payment_error:        string | null;
  payment_released_at:  string | null;
  cancellation_deadline: string;
  created_at:           string;
  updated_at:           string;
}

export interface Review {
  id:                UUID;
  booking_id:        string;
  reviewer_id:       string;
  reviewed_id:       string;
  space_id:          string | null;
  rating:            number;
  comment:           string | null;
  is_host_reviewing: boolean;
  created_at:        string;
}

export interface NearbySpace extends Pick<Space,
  "id" | "title" | "address" | "neighborhood" | "lat" | "lng" |
  "price_per_hour" | "max_guests" | "rating_avg" | "rating_count" | "photos"
> {
  distance_m: number;
}

type UUID = string;

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ SUPABASE CLIENT Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  ?? "";
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = !!(supabaseUrl && supabaseAnon);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnon, {
      auth: {
        persistSession:    true,
        autoRefreshToken:  true,
        detectSessionInUrl: true,
      },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : (null as unknown as ReturnType<typeof createClient>);

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ AUTH HELPERS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ HELPERS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

/**
 * Busca espacios por radio geogrÃƒÂ¡fico usando la funciÃƒÂ³n de PostgreSQL.
 * Retorna espacios ordenados por distancia.
 */
export async function searchNearbySpaces(params: {
  lat:          number;
  lng:          number;
  radiusM?:     number;
  minCapacity?: number;
  maxPrice?:    number;
  checkDate?:   string;
}): Promise<NearbySpace[]> {
  const { lat, lng, radiusM = 5000, minCapacity = 1, maxPrice, checkDate } = params;

  const { data, error } = await supabase.rpc("search_spaces_nearby", {
    search_lat:   lat,
    search_lng:   lng,
    radius_m:     radiusM,
    min_capacity: minCapacity,
    max_price:    maxPrice ?? null,
    check_date:   checkDate ?? null,
  });

  if (error) {
    console.error("Error buscando espacios:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Obtiene el espacio completo con datos del host.
 */
export async function getSpaceWithHost(spaceId: string) {
  const { data, error } = await supabase
    .from("spaces")
    .select("*, host:profiles!host_id(full_name, avatar_url, is_host, created_at)")
    .eq("id", spaceId)
    .eq("status", "active")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtiene reseÃƒÂ±as pÃƒÂºblicas de un espacio (guest -> host/space).
 */
export async function getSpaceReviews(spaceId: string, limit = 12) {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      reviewer:profiles!reviewer_id ( full_name, avatar_url )
    `)
    .eq("space_id", spaceId)
    .eq("is_host_reviewing", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error obteniendo reseÃƒÂ±as:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Obtiene las reservas del usuario actual (como guest o como host).
 */
export async function getMyBookings(role: "guest" | "host") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const column = role === "guest" ? "guest_id" : "host_id";

  const { data, error } = await supabase
    .from("bookings")
    .select("*, space:spaces(id, title, address, neighborhood, photos)")
    .eq(column, user.id)
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) {
    console.error("Error obteniendo reservas:", error);
    return [];
  }

  return data ?? [];
}

/**
 * SuscripciÃƒÂ³n en tiempo real al estado de un booking.
 * ÃƒÅ¡til para la pÃƒÂ¡gina de confirmaciÃƒÂ³n de pago.
 */
export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function subscribeToBooking(
  bookingId: string,
  onUpdate: (booking: Booking) => void
) {
  return supabase
    .channel(`booking-row-${bookingId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "bookings",
        filter: `id=eq.${bookingId}`,
      },
      (payload) => onUpdate(payload.new as Booking)
    )
    .subscribe();
}

export function subscribeToBookingStatus(
  bookingPreferenceId: string,
  onUpdate: (booking: Booking) => void
) {
  return supabase
    .channel(`booking-${bookingPreferenceId}`)
    .on(
      "postgres_changes",
      {
        event:  "UPDATE",
        schema: "public",
        table:  "bookings",
        filter: `mp_preference_id=eq.${bookingPreferenceId}`,
      },
      (payload) => onUpdate(payload.new as Booking)
    )
    .subscribe();
}

/**
 * Sube el avatar del usuario a Supabase Storage.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext  = file.name.split(".").pop();
  const path = `avatars/${userId}.${ext}`;

  const { error } = await supabase.storage
    .from("profiles")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from("profiles").getPublicUrl(path);
  return data.publicUrl;
}
