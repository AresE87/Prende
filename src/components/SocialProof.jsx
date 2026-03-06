import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Quote } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    before: "Coordinar un cumple para 15 personas era pedir favores y cruzar los dedos.",
    after: "En menos de una tarde cerramos una terraza en Buceo y llegamos con todo confirmado.",
    name: "Martina",
    age: 31,
  },
  {
    before: "Teniamos una barbacoa libre varios fines de semana y nadie sabia que estaba disponible.",
    after: "Empezamos a recibir consultas mas claras y reservas con mejor intencion de compra.",
    name: "Diego",
    age: 42,
  },
  {
    before: "El equipo queria salir de la oficina, pero resolver lugar, horario y pago era eterno.",
    after: "Reservamos un espacio en Carrasco y resolvimos el plan completo desde una sola plataforma.",
    name: "Sofia",
    age: 38,
  },
];

export default function SocialProof() {
  const sectionRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".sp-header", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const t = testimonials[current];

  return (
    <section ref={sectionRef} className="bg-carbon py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <div className="sp-header text-center mb-16">
          <span className="inline-block font-mono text-xs font-medium text-crema/30 tracking-widest uppercase mb-4">
            Prueba social
          </span>
          <h2 className="font-jakarta font-bold text-3xl sm:text-4xl text-crema tracking-tight">
            Cuando el proceso se siente facil, la{" "}
            <span className="font-cormorant italic text-brasa">reserva avanza.</span>
          </h2>
        </div>

        <div
          className="relative bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 sm:p-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <Quote className="w-8 h-8 text-brasa/20 mb-6" />

          <div className="mb-8">
            <span className="font-mono text-[10px] text-crema/30 tracking-widest uppercase block mb-2">
              Antes
            </span>
            <p className="font-inter text-lg text-crema/50 leading-relaxed italic">
              "{t.before}"
            </p>
          </div>

          <div className="w-16 h-px bg-brasa/30 mb-8" />

          <div className="mb-8">
            <span className="font-mono text-[10px] text-brasa/60 tracking-widest uppercase block mb-2">
              Lo que cambio
            </span>
            <p className="font-jakarta text-xl sm:text-2xl font-semibold text-crema leading-snug">
              "{t.after}"
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brasa/15 flex items-center justify-center">
              <span className="font-jakarta font-bold text-sm text-brasa">
                {t.name[0]}
              </span>
            </div>
            <div>
              <p className="font-jakarta font-semibold text-sm text-crema">{t.name}</p>
              <p className="font-mono text-xs text-crema/30">{t.age} anos</p>
            </div>
          </div>

          <div className="flex gap-2 mt-8 justify-center">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  i === current ? "bg-brasa w-6" : "bg-crema/20"
                }`}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
