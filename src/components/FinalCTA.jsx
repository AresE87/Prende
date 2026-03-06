import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flame, ArrowRight, ShieldCheck } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function FinalCTA() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".cta-content > *", {
        y: 28,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="reserva" className="bg-[#171616] px-4 py-24 sm:px-6 sm:py-32">
      <div className="cta-content section-shell mx-auto max-w-5xl rounded-[44px] border-white/6 bg-[linear-gradient(135deg,#171616_0%,#261f1b_50%,#171616_100%)] px-6 py-10 text-center text-white sm:px-10 sm:py-14">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10 shadow-[0_24px_44px_-30px_rgba(0,0,0,0.7)]">
          <Flame className="h-8 w-8 text-[#d5632a]" />
        </div>

        <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-white/46">Lanzamiento premium</p>
        <h2 className="mt-4 font-display text-5xl leading-none text-white sm:text-6xl lg:text-7xl">
          Lleva tu proximo encuentro a una reserva mejor resuelta.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/68 sm:text-base">
          Explora espacios, paga con medios locales y confirma en una interfaz que ya se siente mucho mas cerca de una plataforma internacional.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/buscar" className="inline-flex items-center gap-2 rounded-full bg-[#d5632a] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_22px_40px_-24px_rgba(213,99,42,0.82)] transition hover:-translate-y-0.5 hover:bg-[#c75424]">
            Explorar espacios
            <ArrowRight size={15} />
          </Link>
          <Link to="/login?mode=register" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/16">
            Publicar mi espacio
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <Stat text="Checkout embebido y fallback wallet" />
          <Stat text="Arquitectura lista para produccion" />
          <Stat text="Operativa segura con trazabilidad" icon />
        </div>
      </div>
    </section>
  );
}

function Stat({ text, icon = false }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/8 px-4 py-4 text-sm text-white/76 backdrop-blur-md">
      <div className="flex items-center justify-center gap-2">
        {icon && <ShieldCheck size={15} className="text-[#d5632a]" />}
        <span>{text}</span>
      </div>
    </div>
  );
}
