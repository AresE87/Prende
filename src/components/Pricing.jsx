import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Users, Utensils, Waves, Check } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const plans = [
  {
    name: "Reunion chica",
    price: "$800",
    unit: "/h",
    icon: Users,
    highlighted: false,
    features: [
      "Barbacoa simple para encuentros de hasta 8 personas",
      "Ideal para almuerzos, previas y asados chicos",
      "Ticket accesible para decisiones rapidas",
      "Entrada clara para nuevos anfitriones",
    ],
  },
  {
    name: "Asado social",
    price: "$1.200",
    unit: "/h",
    icon: Utensils,
    highlighted: true,
    features: [
      "Quincho equipado para grupos medianos",
      "Mejor equilibrio entre capacidad, comodidad y precio",
      "Categoria pensada para el mayor volumen de reservas",
      "Buen punto de conversion para invitados y hosts",
    ],
  },
  {
    name: "Celebracion premium",
    price: "$1.800",
    unit: "/h",
    icon: Waves,
    highlighted: false,
    features: [
      "Terrazas o espacios amplios con extras y amenities",
      "Pensado para eventos, equipos y ocasiones especiales",
      "Mayor ticket por experiencia, capacidad y propuesta",
      "Mas valor para anfitriones con oferta diferencial",
    ],
  },
];

export default function Pricing() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".price-card", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="precios" className="bg-cream py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-16">
          <span className="inline-block font-mono text-xs font-medium text-carbon/30 tracking-widest uppercase mb-4">
            Rangos orientativos
          </span>
          <h2 className="font-jakarta font-bold text-3xl sm:text-4xl md:text-5xl text-carbon tracking-tight">
            Entiende rapido cuanto puede costar{" "}
            <span className="font-cormorant italic text-brasa">o facturar</span> un encuentro
          </h2>
          <p className="font-inter text-base text-carbon/50 mt-4 max-w-2xl mx-auto">
            Cada anfitrion define su valor final. Estos rangos ayudan a ubicar tipo de espacio, capacidad y ticket esperado antes de entrar al detalle.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`price-card relative rounded-3xl p-8 flex flex-col transition-all duration-300 ${
                plan.highlighted
                  ? "bg-brasa text-crema shadow-xl shadow-brasa/15 md:scale-105 md:-my-4"
                  : "bg-white border border-carbon/[0.06] text-carbon"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-carbon text-crema font-mono text-[10px] tracking-widest uppercase px-4 py-1 rounded-full">
                  Mayor conversion
                </span>
              )}

              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                  plan.highlighted ? "bg-white/15" : "bg-brasa/10"
                }`}
              >
                <plan.icon
                  className={`w-5 h-5 ${plan.highlighted ? "text-crema" : "text-brasa"}`}
                />
              </div>

              <h3
                className={`font-jakarta font-bold text-lg mb-2 ${
                  plan.highlighted ? "text-crema" : "text-carbon"
                }`}
              >
                {plan.name}
              </h3>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-jakarta font-extrabold text-4xl">
                  {plan.price}
                </span>
                <span
                  className={`font-inter text-sm ${
                    plan.highlighted ? "text-crema/60" : "text-carbon/40"
                  }`}
                >
                  {plan.unit}
                </span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? "text-crema/70" : "text-brasa"
                      }`}
                    />
                    <span
                      className={`font-inter text-sm leading-relaxed ${
                        plan.highlighted ? "text-crema/80" : "text-carbon/60"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#reserva"
                className={`block w-full text-center font-jakarta font-bold text-sm py-3.5 rounded-full transition-all duration-300 hover:translate-y-[-1px] hover:shadow-lg ${
                  plan.highlighted
                    ? "bg-crema text-brasa hover:shadow-crema/20"
                    : "bg-brasa text-crema hover:shadow-brasa/20"
                }`}
              >
                Ver espacios
              </a>
            </div>
          ))}
        </div>

        <p className="text-center font-inter text-xs text-carbon/40 mt-8">
          Valores orientativos en pesos uruguayos. El total, los extras y las condiciones se muestran antes de confirmar.
        </p>
      </div>
    </section>
  );
}
