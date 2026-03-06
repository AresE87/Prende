import { createElement, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Flame, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function Hero() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-badge", { y: 18, opacity: 0, duration: 0.7, delay: 0.2 })
        .from(".hero-title-line", { y: 42, opacity: 0, duration: 0.9, stagger: 0.15 }, "-=0.35")
        .from(".hero-subtitle", { y: 18, opacity: 0, duration: 0.7 }, "-=0.45")
        .from(".hero-metrics > *", { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.35")
        .from(".hero-cta", { y: 18, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.25");
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative flex min-h-[100dvh] items-end overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=80&auto=format&fit=crop"
          alt="Personas compartiendo un asado"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,22,22,0.3)_0%,rgba(23,22,22,0.76)_58%,rgba(23,22,22,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(213,99,42,0.28),transparent_24%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-32 sm:px-8 sm:pb-20 lg:pb-24">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-4xl">
            <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-white/88 backdrop-blur-md">
              <Flame className="h-4 w-4 text-[#d5632a]" />
              <span className="text-xs font-medium uppercase tracking-[0.18em]">Pagos, reservas y experiencia en una sola plataforma</span>
            </div>

            <h1 className="mt-8 max-w-4xl">
              <span className="hero-title-line block text-5xl font-semibold leading-[0.96] text-white sm:text-6xl lg:text-7xl xl:text-[5.6rem]">
                Reserva espacios para reunirte
              </span>
              <span className="hero-title-line mt-2 block font-display text-6xl leading-[0.92] text-[#f6d6c5] sm:text-7xl lg:text-8xl xl:text-[6.6rem]">
                con presencia internacional.
              </span>
            </h1>

            <p className="hero-subtitle mt-6 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
              Prende no vende solo disponibilidad. Vende una experiencia clara desde la primera impresion hasta el pago confirmado, con una capa visual mucho mas fuerte y una operacion real sobre Supabase y Mercado Pago.
            </p>

            <div className="hero-cta mt-8 flex flex-wrap gap-3">
              <a href="#reserva" className="inline-flex items-center gap-2 rounded-full bg-[#d5632a] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_22px_40px_-24px_rgba(213,99,42,0.82)] transition hover:-translate-y-0.5 hover:bg-[#c75424]">
                Reservar ahora
                <ArrowRight size={15} />
              </a>
              <a href="#como-funciona" className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/16">
                Ver como funciona
              </a>
            </div>
          </div>

          <div className="hero-metrics grid gap-3">
            <Metric icon={Sparkles} label="Experiencia" value="Marketplace premium para asados y encuentros" />
            <Metric icon={ShieldCheck} label="Pagos" value="Tarjeta, wallet y medios locales en Uruguay" />
            <Metric icon={Flame} label="Operacion" value="Disponibilidad real, checkout y reserva trazable" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="glass-shell rounded-[30px] border-white/10 px-5 py-5 text-white">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#171616] text-[#f7f1e8] shadow-[0_18px_30px_-22px_rgba(23,22,22,0.9)]">
          {createElement(icon, { size: 16 })}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/48">{label}</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-white/86">{value}</p>
        </div>
      </div>
    </div>
  );
}

