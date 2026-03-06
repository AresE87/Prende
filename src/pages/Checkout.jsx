import { createElement, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Shield, Clock3, CalendarDays, Users, BadgeCheck } from "lucide-react";
import CheckoutButton from "../components/booking/CheckoutButton";
import { Button, Card, Skeleton, Badge, PageContainer } from "../components/shared";
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
        if (!id) throw new Error("ID invalido");
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
      <PageContainer>
        <div className="space-y-5">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-16 w-2/3" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <Skeleton className="h-[34rem] w-full rounded-[36px]" />
            <Skeleton className="h-[34rem] w-full rounded-[36px]" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !space) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <div className="surface-card max-w-xl rounded-[34px] px-8 py-10 text-center">
          <p className="text-sm text-[#171616]/62">{error || "No hay reserva en progreso."}</p>
          <Button onClick={() => navigate("/buscar")} className="mt-5">Ir a espacios</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-medium text-[#171616]/58 transition hover:text-[#171616]">
        <ChevronLeft size={16} /> Volver al espacio
      </button>

      <section className="mt-4 section-shell rounded-[40px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <Badge variant="brasa">Checkout verificado</Badge>
            <h1 className="mt-5 font-display text-5xl leading-none text-[#171616] sm:text-6xl lg:text-7xl">
              Cierra la reserva con una experiencia de pago clara.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#171616]/62 sm:text-base">
              Ya estas en el tramo final. Revisamos precio, reglas y medio de pago dentro de un flujo pensado para convertir sin friccion.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <Metric icon={BadgeCheck} label="Estado" value="Horario bloqueado" />
            <Metric icon={Shield} label="Seguridad" value="Pago tokenizado" />
            <Metric icon={Clock3} label="Confirmacion" value="Automatico" />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card className="rounded-[36px] overflow-hidden p-0">
            <div className="grid gap-0 md:grid-cols-[260px_minmax(0,1fr)]">
              <img src={coverPhoto} alt={space.title} className="h-64 w-full object-cover md:h-full" />
              <div className="px-6 py-6 sm:px-8 sm:py-8">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">{space.neighborhood ?? "Montevideo"}</Badge>
                  <Badge variant="oliva">Anfitrion validado</Badge>
                </div>
                <h2 className="mt-4 text-3xl font-semibold text-[#171616]">{space.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#171616]/64">
                  El resumen se mantiene visible para que el usuario no pierda contexto mientras define fecha, horario y forma de pago.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <InfoPill icon={Users} label="Capacidad" value={`${space.max_guests} personas`} />
                  <InfoPill icon={Clock3} label="Minimo" value={`${space.min_hours} horas`} />
                  <InfoPill icon={CalendarDays} label="Tarifa" value={`${formatUYU(space.price_per_hour)} / h`} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-[36px] p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Politica</p>
            <h2 className="mt-3 font-display text-4xl leading-none text-[#171616]">Cancelacion simple, reglas visibles.</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <PolicyRow title="Reembolso total" description="Hasta 24 horas antes del inicio de la reserva." />
              <PolicyRow title="Pago seguro" description="Tokenizacion y procesamiento con Mercado Pago y validacion backend." />
              <PolicyRow title="Confirmacion" description="El webhook confirma el pago y actualiza la reserva automaticamente." />
              <PolicyRow title="Medios locales" description="Tarjeta, wallet, Abitab y Red Pagos segun configuracion activa." />
            </div>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24 rounded-[36px] overflow-hidden p-0">
            <div className="border-b border-[#171616]/8 bg-[linear-gradient(135deg,#171616_0%,#2a2521_100%)] px-6 py-6 text-[#f7f1e8]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#f7f1e8]/45">Pago protegido</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Checkout de nivel marketplace</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#f7f1e8]/62">
                La UI queda dentro de la app, pero el procesamiento sigue una arquitectura segura y trazable.
              </p>
            </div>
            <div className="px-4 py-4 sm:px-5 sm:py-5">
              <CheckoutButton
                spaceId={space.id}
                pricePerHour={space.price_per_hour}
                minHours={space.min_hours}
                maxGuests={space.max_guests}
                spaceName={space.title}
              />

              <div className="mt-4 rounded-[24px] border border-[#5f6f52]/14 bg-[linear-gradient(180deg,#f8fbf4_0%,#eef4e8_100%)] px-4 py-4 text-sm text-[#171616]/68">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#5f6f52] text-white shadow-[0_16px_28px_-22px_rgba(95,111,82,0.82)]">
                    <Shield size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#171616]">Seguridad operativa</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#171616]/62">
                      Tus datos de tarjeta no se guardan en Prende. Solo persistimos el estado y la evidencia del pago necesario para operar la reserva.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </PageContainer>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="glass-shell rounded-[28px] px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#171616] text-[#f7f1e8] shadow-[0_18px_30px_-22px_rgba(23,22,22,0.9)]">
          {createElement(icon, { size: 16 })}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[#171616]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InfoPill({ icon, label, value }) {
  return (
    <div className="rounded-[24px] border border-[#171616]/8 bg-white/75 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171616] text-[#f7f1e8] shadow-[0_16px_26px_-20px_rgba(23,22,22,0.82)]">
          {createElement(icon, { size: 15 })}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[#171616]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function PolicyRow({ title, description }) {
  return (
    <div className="rounded-[26px] border border-[#171616]/8 bg-white/75 px-5 py-5 shadow-[0_16px_34px_-30px_rgba(23,22,22,0.55)]">
      <p className="text-sm font-semibold text-[#171616]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#171616]/62">{description}</p>
    </div>
  );
}

