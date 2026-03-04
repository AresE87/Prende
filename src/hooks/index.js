/**
 * hooks/index.js
 * Custom React Query hooks para conectar con el backend.
 * Reemplazar las llamadas mock con los endpoints reales de la API.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Error del servidor");
  }
  return res.json();
}

// ─── SPACES ──────────────────────────────────────────────────────────────────

/** Buscar espacios con filtros */
export function useSpaces(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null && v !== ""))
  ).toString();

  return useQuery({
    queryKey: ["spaces", filters],
    queryFn: () => apiFetch(`/spaces${params ? "?" + params : ""}`),
    staleTime: 1000 * 60 * 5,
  });
}

/** Detalle de un espacio */
export function useSpace(id) {
  return useQuery({
    queryKey: ["space", id],
    queryFn: () => apiFetch(`/spaces/${id}`),
    enabled: !!id,
  });
}

/** Disponibilidad de un espacio para un mes */
export function useSpaceAvailability(spaceId, year, month) {
  return useQuery({
    queryKey: ["availability", spaceId, year, month],
    queryFn: () => apiFetch(`/spaces/${spaceId}/availability?year=${year}&month=${month}`),
    enabled: !!spaceId && !!year && !!month,
  });
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

/** Reservas del usuario autenticado */
export function useMyBookings() {
  return useQuery({
    queryKey: ["myBookings"],
    queryFn: () => apiFetch("/bookings/me"),
  });
}

/** Crear reserva */
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiFetch("/bookings", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myBookings"] }),
  });
}

/** Cancelar reserva */
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch(`/bookings/${id}/cancel`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myBookings"] }),
  });
}

// ─── HOST ─────────────────────────────────────────────────────────────────────

/** Reservas del espacio del host */
export function useHostBookings(filters = {}) {
  return useQuery({
    queryKey: ["hostBookings", filters],
    queryFn: () => apiFetch("/host/bookings"),
  });
}

/** Confirmar / rechazar reserva (host) */
export function useRespondBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }) =>
      apiFetch(`/host/bookings/${id}/${action}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hostBookings"] }),
  });
}

/** Dashboard stats del host */
export function useHostStats() {
  return useQuery({
    queryKey: ["hostStats"],
    queryFn: () => apiFetch("/host/stats"),
  });
}

/** Ganancias del host */
export function useHostEarnings() {
  return useQuery({
    queryKey: ["hostEarnings"],
    queryFn: () => apiFetch("/host/earnings"),
  });
}

/** Actualizar disponibilidad (bloquear/desbloquear fechas) */
export function useUpdateAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ spaceId, dates, action }) =>
      apiFetch(`/host/spaces/${spaceId}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ dates, action }),
      }),
    onSuccess: (_, { spaceId }) =>
      qc.invalidateQueries({ queryKey: ["availability", spaceId] }),
  });
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

/** Reviews de un espacio */
export function useSpaceReviews(spaceId) {
  return useQuery({
    queryKey: ["reviews", spaceId],
    queryFn: () => apiFetch(`/spaces/${spaceId}/reviews`),
    enabled: !!spaceId,
  });
}

/** Crear reseña */
export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, ratings, comment }) =>
      apiFetch(`/bookings/${bookingId}/review`, {
        method: "POST",
        body: JSON.stringify({ ratings, comment }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myBookings"] }),
  });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

/** Login */
export function useLogin() {
  return useMutation({
    mutationFn: (creds) =>
      apiFetch("/auth/login", { method: "POST", body: JSON.stringify(creds) }),
  });
}

/** Register */
export function useRegister() {
  return useMutation({
    mutationFn: (data) =>
      apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  });
}

/** Subir espacio (host onboarding) */
export function useCreateSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) =>
      apiFetch("/host/spaces", { method: "POST", body: formData }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spaces"] }),
  });
}
