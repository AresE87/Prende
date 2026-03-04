import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { Button, Card, Textarea, PageContainer } from "../components/shared";
import { MOCK_BOOKINGS } from "../lib/utils";

const CATEGORIES = [
  { id: "cleanliness", label: "Limpieza" },
  { id: "amenities",   label: "Amenities" },
  { id: "host",        label: "Anfitrión" },
  { id: "value",       label: "Relación precio/calidad" },
];

export default function ReviewFlow() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const booking = MOCK_BOOKINGS.find((b) => b.id === bookingId) ?? MOCK_BOOKINGS[0];

  const [ratings, setRatings] = useState({ cleanliness: 0, amenities: 0, host: 0, value: 0 });
  const [hover, setHover]     = useState({});
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  const overall = Object.values(ratings).reduce((s, v) => s + v, 0) / 4;
  const valid = Object.values(ratings).every((v) => v > 0) && comment.length >= 10;

  async function submit() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <PageContainer className="max-w-xl">
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🙌</div>
          <h1 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-2">¡Gracias por tu reseña!</h1>
          <p className="text-[#1C1917]/60 font-['Inter'] mb-8">Tu opinión ayuda a otros asadores a elegir bien.</p>
          <Button onClick={() => navigate("/mis-reservas")}>Ir a mis reservas</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-xl">
      <h1 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-2">¿Cómo estuvo?</h1>
      <p className="text-[#1C1917]/60 font-['Inter'] mb-8">Contanos tu experiencia en <strong className="text-[#1C1917]">{booking.spaceTitle}</strong></p>

      <Card className="p-6 space-y-6">
        {/* Category ratings */}
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1C1917] font-['Inter']">{cat.label}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHover((p) => ({ ...p, [cat.id]: star }))}
                  onMouseLeave={() => setHover((p) => ({ ...p, [cat.id]: 0 }))}
                  onClick={() => setRatings((p) => ({ ...p, [cat.id]: star }))}
                >
                  <Star
                    size={24}
                    className={
                      star <= (hover[cat.id] || ratings[cat.id])
                        ? "text-[#D4541B] fill-[#D4541B]"
                        : "text-[#1C1917]/20"
                    }
                  />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Overall */}
        {overall > 0 && (
          <div className="bg-[#FAF7F2] rounded-xl py-3 text-center">
            <p className="text-xs text-[#1C1917]/40 font-['Inter'] mb-1">Puntuación general</p>
            <p className="text-3xl font-bold text-[#D4541B] font-['JetBrains_Mono']">{overall.toFixed(1)}</p>
          </div>
        )}

        {/* Comment */}
        <Textarea
          label="Contanos más (mínimo 10 caracteres)"
          placeholder="¿Cómo fue el espacio? ¿Qué destacarías? ¿Volvería a reservar?"
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
