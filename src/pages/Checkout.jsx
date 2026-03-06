import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";
import CheckoutButton from "../components/booking/CheckoutButton";
import { Button, Card, Skeleton } from "../components/shared";
import { getSpaceWithHost } from "../lib/supabase";
import { formatUYU } from "../lib/utils";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800";

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSpace() {
      setLoading(true);
      setError("");

      try {
        if (!id) throw new Error("ID invÃ¡lido");
        const spaceData = await getSpaceWithHost(id);
        if (!cancelled) setSpace(spaceData);
      } catch (err) {
        console.error("Error cargando checkout:", err);
        if (!cancelled) setError("No pudimos preparar el checkout.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSpace();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const coverPhoto = useMemo(() => {
    if (Array.isArray(space?.photos) && space.photos.length > 0) return space.photos[0];
    return PLACEHOLDER_IMAGE;
  }, [space]);

  if (loading) {
    return (
      <div className="bg-[#FAF7F2] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-12 w-2/3" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <Skeleton className="h-[420px] lg:col-span-3" />
            <Skeleton className="h-[420px] lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-[#1C1917]/60 font-['Inter']">{error || "No hay reserva en progreso."}</p>
        <Button onClick={() => navigate("/buscar")} className="mt-4">Ir a espacios</Button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[#1C1917]/60 hover:text-[#1C1917] mb-6 font-['Inter'] transition-colors">
          <ChevronLeft size={16} /> Volver al espacio
        </button>

        <h1 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-8">ConfirmÃ¡ tu reserva</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-5">
              <h2 className="font-bold text-[#1C1917] mb-4 font-['Plus_Jakarta_Sans']">Espacio seleccionado</h2>
              <div className="flex gap-4">
                <img src={coverPhoto} alt={space.title} className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#1C1917] text-sm font-['Plus_Jakarta_Sans']">{space.title}</p>
                  <p className="text-xs text-[#C2956B] mt-0.5 font-['Inter']">?? {space.neighborhood ?? "Montevideo"}</p>
                  <div className="mt-2 space-y-1 text-xs text-[#1C1917]/60 font-['Inter']">
                    <p>Capacidad mÃ¡xima: {space.max_guests} personas</p>
                    <p>MÃ­nimo: {space.min_hours} horas</p>
                    <p>Precio: {formatUYU(space.price_per_hour)} / hora</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="text-sm text-[#1C1917]/60 font-['Inter'] leading-relaxed">
              <p className="font-semibold text-[#1C1917] mb-1">PolÃ­tica de cancelaciÃ³n</p>
              <p>CancelaciÃ³n con reembolso completo hasta <strong>24 horas antes</strong> del inicio de la reserva.</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <Card className="p-5 sticky top-24">
              <CheckoutButton
                spaceId={space.id}
                pricePerHour={space.price_per_hour}
                minHours={space.min_hours}
                maxGuests={space.max_guests}
                spaceName={space.title}
              />

              <p className="text-xs text-[#1C1917]/40 mt-4 flex items-center gap-1.5 font-['Inter']">
                <Shield size={12} /> Tarjetas, Mercado Pago, Abitab y Red Pagos operan sobre infraestructura segura de Mercado Pago.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
