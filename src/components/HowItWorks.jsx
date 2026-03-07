import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, CalendarCheck, Flame } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    num: "01",
    icon: Search,
    title: "Descubre y compara",
    desc: "Explora barbacoas, quinchos y terrazas segun zona, cantidad de personas, estilo y presupuesto.",
    anim: "bounce",
  },
  {
    num: "02",
    icon: CalendarCheck,
    title: "Bloquea la fecha",
    desc: "Revisa disponibilidad real, define horario y confirma online sin perseguir respuestas por distintos canales.",
    anim: "check",
  },
  {
    num: "03",
    icon: Flame,
    title: "Prende la parrilla",
    desc: "Llegas con todo confirmado: lugar, horario y direccion. Solo queda disfrutar el encuentro.",
    anim: "pulse",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".step-card", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      });

      gsap.to(".icon-bounce", {
        y: -4,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 1,
      });

      gsap.to(".icon-pulse", {
        scale: 1.15,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const iconClass = (anim) => {
    if (anim === "bounce") return "icon-bounce";
    if (anim === "pulse") return "icon-pulse";
    return "";
  };

  return (
    <section ref={sectionRef} id="como-funciona" className="bg-carbon py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-16">
          <span className="inline-block font-mono text-xs font-medium text-crema/30 tracking-widest uppercase mb-4">
            Asi de facil
          </span>
          <h2 className="font-jakarta font-bold text-3xl sm:text-4xl md:text-5xl text-crema tracking-tight">
            Reserva tu espacio en{" "}
            <span className="font-cormorant italic text-brasa">tres pasos.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="step-card relative bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 group hover:bg-white/[0.06] transition-colors duration-500"
            >
              <span className="font-mono text-5xl font-bold text-brasa/15 absolute top-6 right-8">
                {step.num}
              </span>

              <div className={`w-14 h-14 rounded-2xl bg-brasa/10 flex items-center justify-center mb-6 ${iconClass(step.anim)}`}>
                <step.icon className="w-6 h-6 text-brasa" />
              </div>

              <h3 className="font-jakarta font-bold text-xl text-crema mb-3 tracking-tight">
                {step.title}
              </h3>
              <p className="font-inter text-sm text-crema/58 leading-relaxed">
                {step.desc}
              </p>

              {step.num !== "03" && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t border-dashed border-brasa/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
