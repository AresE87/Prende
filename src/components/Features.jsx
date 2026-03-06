import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Activity, CalendarDays, CheckCircle2, MapPin, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const MAP_PINS = [
  { label: "Pocitos", price: "desde $800/h", x: "40%", y: "58%" },
  { label: "Punta Carretas", price: "desde $1.200/h", x: "24%", y: "42%" },
  { label: "Carrasco", price: "desde $1.500/h", x: "74%", y: "28%" },
  { label: "Buceo", price: "desde $980/h", x: "55%", y: "46%" },
];

const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const TIME_SLOTS = ["10:00", "13:00", "16:00", "19:00"];
const TERMINAL_LINES = [
  "Buscando espacios con parrilla en Pocitos...",
  "3 barbacoas disponibles este sabado...",
  "Comparando precios, capacidad y amenities...",
  "Pago confirmado. Reserva enviada al anfitrion.",
];

function MapFeature() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".map-feature-node", {
        scale: 0.7,
        opacity: 0,
        y: 18,
        duration: 0.65,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 76%" },
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <article
      ref={ref}
      className="surface-card surface-card-hover relative overflow-hidden rounded-[40px] px-6 py-6 sm:px-8 sm:py-8 lg:min-h-[520px]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,216,232,0.38),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(213,99,42,0.14),transparent_28%),linear-gradient(180deg,rgba(255,253,248,0.96)_0%,rgba(246,239,229,0.84)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(35,29,25,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(35,29,25,0.05) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <div className="absolute -right-12 bottom-0 h-56 w-56 rounded-full bg-[#d5632a]/10 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#231d19]/38">Busca por zona</p>
            <h3 className="mt-3 text-3xl font-semibold leading-tight text-[#231d19] sm:text-[2.1rem]">
              Explora quinchos, barbacoas y terrazas cerca tuyo.
            </h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#231d19]/8 bg-white/78 px-4 py-2 text-xs font-medium text-[#231d19]/66 shadow-[0_16px_32px_-28px_rgba(73,52,40,0.24)]">
            <MapPin size={14} className="text-[#d5632a]" />
            4 zonas activas
          </div>
        </div>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#231d19]/58 sm:text-base">
          Filtra por barrio y compara espacios con parrilla en Pocitos, Punta Carretas, Buceo, Carrasco y otras zonas de Montevideo.
        </p>

        <div className="relative mt-8 flex-1 overflow-hidden rounded-[32px] border border-[#231d19]/8 bg-[linear-gradient(180deg,rgba(247,243,234,0.96)_0%,rgba(239,232,219,0.82)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
          <svg className="absolute inset-0 h-full w-full opacity-[0.42]" viewBox="0 0 640 420" preserveAspectRatio="none">
            <path d="M-20 285 C 72 210, 176 195, 252 222 C 334 251, 416 246, 470 216 C 524 186, 588 180, 680 230 L 680 420 L -20 420 Z" fill="rgba(95,111,82,0.12)" />
            <path d="M-10 320 C 110 254, 188 242, 276 266 C 354 287, 448 286, 542 248 C 596 225, 636 218, 690 245" fill="none" stroke="rgba(35,29,25,0.08)" strokeWidth="2" strokeDasharray="6 10" />
          </svg>

          <div className="absolute right-5 top-5 rounded-[26px] border border-[#231d19]/8 bg-white/82 px-4 py-3 shadow-[0_20px_34px_-28px_rgba(73,52,40,0.22)] backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#231d19]/36">Montevideo</p>
            <p className="mt-1 text-sm font-semibold text-[#231d19]">Espacios con parrilla por barrio</p>
          </div>

          {MAP_PINS.map((pin, index) => (
            <div
              key={pin.label}
              className="map-feature-node absolute"
              style={{ left: pin.x, top: pin.y }}
            >
              <span className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d5632a]/12 blur-xl" />
              <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d5632a]/20 bg-[#d5632a]/12 animate-pulse" />
              <span className="relative block h-4 w-4 rounded-full bg-[#d5632a] shadow-[0_10px_22px_-8px_rgba(213,99,42,0.88)]" />
              <div className={`mt-3 rounded-[22px] border border-[#231d19]/8 bg-white/84 px-4 py-3 shadow-[0_20px_34px_-28px_rgba(73,52,40,0.22)] backdrop-blur-sm ${index % 2 === 0 ? "translate-x-0" : "-translate-x-8"}`}>
                <p className="text-sm font-semibold text-[#231d19]">{pin.label}</p>
                <p className="mt-1 font-mono text-xs text-[#231d19]/46">{pin.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function AvailabilityFeature() {
  const ref = useRef(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top 80%" },
      });

      timeline
        .to({}, { duration: 0.45, onComplete: () => setSelectedDay(5) })
        .to({}, { duration: 0.35, onComplete: () => setSelectedSlot("16:00") })
        .to({}, { duration: 0.4, onComplete: () => setConfirmed(true) });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <article
      ref={ref}
      className="surface-card surface-card-hover relative overflow-hidden rounded-[40px] px-6 py-6 sm:px-8 sm:py-8"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(213,99,42,0.18),transparent_28%),linear-gradient(180deg,rgba(255,248,242,0.94)_0%,rgba(248,238,228,0.88)_100%)]" />
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#231d19]/38">Agenda disponible</p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-[#231d19] sm:text-[2rem]">
              Revisa fechas y horarios antes de confirmar tu reserva.
            </h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d5632a]/16 bg-[#fff0e7] px-4 py-2 text-xs font-medium text-[#b75a2f]">
            <CalendarDays size={14} />
            En vivo
          </div>
        </div>

        <div className="mt-6 rounded-[30px] border border-[#231d19]/8 bg-white/76 p-5 shadow-[0_22px_34px_-28px_rgba(73,52,40,0.18)] backdrop-blur-sm">
          <div className="grid grid-cols-7 gap-2">
            {WEEK_DAYS.map((day, index) => {
              const active = selectedDay === index;
              const muted = index === 6;

              return (
                <div key={day} className="text-center">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[#231d19]/34">{day}</span>
                  <div
                    className={`rounded-[18px] px-2 py-4 text-sm font-medium transition-all duration-500 ${active ? "bg-[linear-gradient(135deg,#de8355_0%,#c86534_100%)] text-white shadow-[0_16px_28px_-18px_rgba(213,99,42,0.52)]" : muted ? "bg-[#231d19]/4 text-[#231d19]/26" : "bg-[#231d19]/4 text-[#231d19]/54"}`}
                  >
                    {10 + index}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TIME_SLOTS.map((slot) => {
              const active = selectedSlot === slot;
              return (
                <div
                  key={slot}
                  className={`rounded-[18px] border px-4 py-3 text-center font-mono text-sm transition-all duration-500 ${active ? "border-[#d5632a]/24 bg-[#fff1e8] text-[#c55f31] shadow-[0_12px_26px_-20px_rgba(213,99,42,0.44)]" : "border-[#231d19]/8 bg-white/66 text-[#231d19]/42"}`}
                >
                  {slot}
                </div>
              );
            })}
          </div>

          <div className={`mt-5 flex items-center justify-center gap-2 rounded-[20px] px-4 py-4 text-sm font-semibold transition-all duration-500 ${confirmed ? "bg-[linear-gradient(135deg,#f0c4a7_0%,#d68b5c_100%)] text-[#4a2412] shadow-[0_18px_34px_-24px_rgba(213,99,42,0.42)]" : "bg-[#231d19]/5 text-[#231d19]/35"}`}>
            <CheckCircle2 size={16} />
            {confirmed ? "Reserva confirmada" : "Esperando seleccion"}
          </div>
        </div>
      </div>
    </article>
  );
}

function TelemetryFeature() {
  const ref = useRef(null);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex((prev) => (prev + 1) % TERMINAL_LINES.length);
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  return (
    <article
      ref={ref}
      className="relative overflow-hidden rounded-[40px] border border-[#231d19]/12 bg-[linear-gradient(135deg,#231d19_0%,#151210_100%)] px-6 py-6 text-[#f8f3ea] shadow-[0_26px_56px_-40px_rgba(35,29,25,0.42)] sm:px-8 sm:py-8"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(213,99,42,0.18),transparent_22%)]" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/34">Seguimiento</p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-[2rem]">
              Sigue el estado de tu reserva en tiempo real.
            </h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5f6f52]/18 bg-[#5f6f52]/16 px-4 py-2 text-xs font-medium text-[#d9ead0]">
            <Activity size={14} />
            En vivo
          </div>
        </div>

        <div className="mt-6 rounded-[30px] border border-white/8 bg-black/18 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#d75d5d]" />
            <span className="h-3 w-3 rounded-full bg-[#c9a02f]" />
            <span className="h-3 w-3 rounded-full bg-[#4e9e67]" />
            <span className="ml-auto text-[11px] uppercase tracking-[0.2em] text-white/28">Sesion activa</span>
          </div>

          <div className="mt-5 space-y-3 font-mono text-[15px] leading-relaxed">
            {TERMINAL_LINES.slice(0, lineIndex + 1).map((line, index) => (
              <div key={line} className="flex items-start gap-3">
                <span className="mt-[2px] text-[#d5632a]">›</span>
                <span className={index === lineIndex ? "text-white" : "text-white/38"}>{line}</span>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <span className="text-[#d5632a]">›</span>
              <span className="h-4 w-2 bg-[#d5632a] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Features() {
  return (
    <section id="espacios" className="bg-transparent py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="section-shell rounded-[46px] px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#231d19]/8 bg-white/76 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[#231d19]/42 shadow-[0_16px_28px_-24px_rgba(73,52,40,0.16)]">
                <Sparkles size={14} className="text-[#d5632a]" />
                Como funciona Prende
              </div>
              <h2 className="mt-5 font-display text-5xl leading-none text-[#231d19] sm:text-6xl lg:text-7xl">
                Busca, compara y reserva espacios con parrilla en minutos.
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-relaxed text-[#231d19]/58 sm:text-base">
              Prende te permite explorar zonas, ver disponibilidad real y confirmar tu reserva online con un flujo claro para invitados y anfitriones.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
            <MapFeature />
            <div className="grid gap-6">
              <AvailabilityFeature />
              <TelemetryFeature />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
