import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { Button, Card, Textarea, PageContainer, Skeleton } from "../components/shared";
import { supabase } from "../lib/supabase";

const CATEGORIES = [
  { id: "cleanliness", label: "Limpieza" },
  { id: "amenities", label: "Amenities" },
  { id: "host", label: "Anfitrión" },
  { id: "value", label: "Relación precio/calidad" },
];

export default function ReviewFlow() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [submitError, setSubmitError] = useState("");

  const [ratings, setRatings] = useState({ cleanliness: 0, amenities: 0, host: 0, value: 0 });
  const [hover, setHover] = useState({});
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBooking() {
      setLoadingBooking(true);
      try {
        if (!bookingId) throw new Error("Reserva inválida");

        const { data, error } = await supabase
          .from("bookings")
          .select("id, space_id, host_id, status, space:spaces(title)")
          .eq("id", bookingId)
          .single();

        if (error) throw error;
        if (!cancelled) setBooking(data);
      } catch {
        if (!cancelled) setBooking(null);
      } finally {
        if (!cancelled) setLoadingBooking(false);
      }
    }

    loadBooking();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const overall = useMemo(
    () => Object.values(ratings).reduce((sum, value) => sum + value, 0) / CATEGORIES.length,
    [ratings],
  );

  const valid = Object.values(ratings).every((value) => value > 0) && comment.trim().length >= 10;

  async function submit() {
    if (!booking) return;

    setLoading(true);
    setSubmitError("");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Debés iniciar sesión para enviar reseñas");

      if (booking.status !== "completed") {
        throw new Error("Solo podés reseñar reservas completadas");
      }

      const { error } = await supabase
        .from("reviews")
        .insert({
          booking_id: booking.id,
          reviewer_id: userData.user.id,
          reviewed_id: booking.host_id,
          space_id: booking.space_id,
          rating: Math.round(overall),
          comment: comment.trim(),
          is_host_reviewing: false,
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Ya enviaste una reseña para esta reserva");
        }
        throw error;
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No se pudo enviar la reseña");
    } finally {
      setLoading(false);
    }
  }

  if (loadingBooking) {
    return (
      <PageContainer className="max-w-xl">
        <Skeleton className="h-8 w-44 mb-3" />
        <Skeleton className="h-5 w-3/4 mb-8" />
        <Card className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-8 w-full" />
          ))}
        </Card>
      </PageContainer>
    );
  }

  if (!booking) {
    return (
      <PageContainer className="max-w-xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-2">Reserva no encontrada</h1>
          <p className="text-[#1C1917]/60 font-['Inter'] mb-8">No pudimos cargar la reserva para reseñar.</p>
          <Button onClick={() => navigate("/mis-reservas")}>Ir a mis reservas</Button>
        </div>
      </PageContainer>
    );
  }

  if (submitted) {
    return (
      <PageContainer className="max-w-xl">
        <div className="text-center py-12">
          <div className="text-5xl mb-4">??</div>
          <h1 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-2">¡Gracias por tu reseña!</h1>
          <p className="text-[#1C1917]/60 font-['Inter'] mb-8">Tu opinión ayuda a otros asadores a elegir mejor.</p>
          <Button onClick={() => navigate("/mis-reservas")}>Ir a mis reservas</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-xl">
      <h1 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-2">¿Cómo estuvo?</h1>
      <p className="text-[#1C1917]/60 font-['Inter'] mb-8">
        Contanos tu experiencia en <strong className="text-[#1C1917]">{booking.space?.title ?? "este espacio"}</strong>
      </p>

      {submitError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <Card className="p-6 space-y-6">
        {CATEGORIES.map((category) => (
          <div key={category.id} className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1C1917] font-['Inter']">{category.label}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHover((prev) => ({ ...prev, [category.id]: star }))}
                  onMouseLeave={() => setHover((prev) => ({ ...prev, [category.id]: 0 }))}
                  onClick={() => setRatings((prev) => ({ ...prev, [category.id]: star }))}
                >
                  <Star
                    size={24}
                    className={star <= (hover[category.id] || ratings[category.id]) ? "text-[#D4541B] fill-[#D4541B]" : "text-[#1C1917]/20"}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}

        {overall > 0 && (
          <div className="bg-[#FAF7F2] rounded-xl py-3 text-center">
            <p className="text-xs text-[#1C1917]/40 font-['Inter'] mb-1">Puntuación general</p>
            <p className="text-3xl font-bold text-[#D4541B] font-['JetBrains_Mono']">{overall.toFixed(1)}</p>
          </div>
        )}

        <Textarea
          label="Contanos más (mínimo 10 caracteres)"
          placeholder="¿Cómo fue el espacio? ¿Qué destacarías? ¿Volverías a reservar?"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <Button fullWidth size="lg" disabled={!valid} loading={loading} onClick={submit}>
          Enviar reseña
        </Button>
      </Card>
    </PageContainer>
  );
}
