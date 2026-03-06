import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Home, Users, AlertCircle, MapPin, Clock, Flame } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const problems = [
  { icon: Home, text: "La gente quiere organizar mejores encuentros, pero encontrar un lugar confiable consume horas." },
  { icon: AlertCircle, text: "Los anfitriones tienen fechas libres y espacios ociosos con poca visibilidad para monetizarlos." },
  { icon: Users, text: "WhatsApp, senas y agendas manuales generan dudas, friccion y reservas que no terminan de cerrar." },
];

const solutions = [
  { icon: MapPin, text: "Prende ordena la oferta por zona, capacidad, estilo y precio para acelerar la decision." },
  { icon: Clock, text: "Invitados y anfitriones ven disponibilidad, condiciones y valor desde el primer momento." },
  { icon: Flame, text: "La reserva se confirma online, con mas confianza para ambos lados y menos friccion comercial." },
];

export default function ProblemSolution() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".ps-left", {
        x: -40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      gsap.from(".ps-right", {
        x: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-cream py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <span className="ps-left inline-block font-mono text-xs font-medium text-carbon/40 tracking-widest uppercase mb-4">
              El problema del mercado
            </span>
            <h2 className="ps-left font-jakarta font-bold text-2xl sm:text-3xl text-carbon mb-8 tracking-tight">
              La demanda existe. La experiencia todavia no.
            </h2>
            <div className="space-y-5">
              {problems.map((item, i) => (
                <div key={i} className="ps-left flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-carbon/5 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-carbon/50" />
                  </div>
                  <p className="font-inter text-base text-carbon/70 pt-2.5 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="ps-right inline-block font-mono text-xs font-medium text-brasa/60 tracking-widest uppercase mb-4">
              La oportunidad
            </span>
            <h2 className="ps-right font-jakarta font-bold text-2xl sm:text-3xl text-carbon mb-8 tracking-tight">
              Con{" "}
              <span className="font-cormorant italic text-brasa text-3xl sm:text-4xl">Prende</span>
              {" "}la oferta y la demanda se encuentran en un solo flujo.
            </h2>
            <div className="space-y-5">
              {solutions.map((item, i) => (
                <div key={i} className="ps-right flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-brasa/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-brasa" />
                  </div>
                  <p className="font-inter text-base text-carbon/80 pt-2.5 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
