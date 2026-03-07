import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { Flame, ArrowRight } from "lucide-react";

export default function Hero() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-badge", { y: 18, opacity: 0, duration: 0.7, delay: 0.2 })
        .from(".hero-title-line", { y: 42, opacity: 0, duration: 0.9, stagger: 0.15 }, "-=0.35")
        .from(".hero-subtitle", { y: 18, opacity: 0, duration: 0.7 }, "-=0.45")
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
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,13,0.74)_0%,rgba(25,21,18,0.44)_18%,rgba(35,29,25,0.62)_56%,rgba(35,29,25,0.82)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(213,99,42,0.2),transparent_24%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-32 sm:px-8 sm:pb-20 lg:pb-24">
        <div>
          <div className="max-w-4xl">
            <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/9 px-4 py-2 text-white/84 backdrop-blur-md">
              <Flame className="h-4 w-4 text-[#d5632a]" />
              <span className="text-xs font-medium uppercase tracking-[0.18em]">Marketplace de espacios con parrilla en Montevideo</span>
            </div>

            <h1 className="mt-8 max-w-4xl">
              <span className="hero-title-line block text-5xl font-semibold leading-[0.96] text-white sm:text-6xl lg:text-7xl xl:text-[5.6rem]">
                Reserva el lugar ideal
              </span>
              <span className="hero-title-line mt-2 block font-display text-6xl leading-[0.92] text-[#f6d6c5] sm:text-7xl lg:text-8xl xl:text-[6.6rem]">
                para reunir a tu gente.
              </span>
            </h1>

            <p className="hero-subtitle mt-6 max-w-2xl text-base leading-relaxed text-white/78 sm:text-lg">
              Prende conecta personas que quieren celebrar con anfitriones que tienen barbacoas, quinchos y terrazas listas para monetizar. Busca, compara, paga y confirma en minutos desde una sola plataforma.
            </p>

            <div className="hero-cta mt-8 flex flex-wrap gap-3">
              <Link to="/buscar" className="subtle-hover inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#dc7c4d_0%,#c95f31_100%)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_22px_40px_-24px_rgba(213,99,42,0.56)] transition hover:bg-[linear-gradient(135deg,#e08a5d_0%,#cd6b41_100%)]">
                Explorar espacios
                <ArrowRight size={15} />
              </Link>
              <a href="#como-funciona" className="subtle-hover inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/9 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/14">
                Ver como funciona
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
