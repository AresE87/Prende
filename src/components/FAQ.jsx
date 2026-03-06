import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Plus, X } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    q: "Que resuelve exactamente Prende?",
    a: "Prende es un marketplace para descubrir, comparar y reservar espacios con parrilla en Montevideo. Reune oferta, disponibilidad y pago en una sola experiencia.",
  },
  {
    q: "Como gana dinero Prende?",
    a: "La plataforma crece cobrando una comision por cada reserva confirmada. Asi el negocio se alinea con mas ocupacion para los anfitriones y mejor experiencia para quienes reservan.",
  },
  {
    q: "Si tengo un espacio, como empiezo a ganar?",
    a: "Publicas tu espacio, defines disponibilidad, precio y condiciones. Cuando llega una reserva, gestionas todo desde tu cuenta y conviertes fechas libres en ingresos.",
  },
  {
    q: "Que ve el invitado antes de pagar?",
    a: "Fotos, capacidad, ubicacion, horarios, precio y extras. La idea es que la decision se tome con la mayor claridad posible antes de confirmar.",
  },
  {
    q: "Que pasa si necesito cambiar o cancelar?",
    a: "Cada reserva muestra sus condiciones antes de confirmar. Ademas, Prende prioriza reprogramaciones simples y una comunicacion clara entre ambas partes.",
  },
];

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="border-b border-carbon/[0.06] last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="font-jakarta font-semibold text-base sm:text-lg text-carbon pr-8 group-hover:text-brasa transition-colors duration-300">
          {faq.q}
        </span>
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-full border border-carbon/10 flex items-center justify-center transition-all duration-300 ${
            isOpen ? "bg-brasa border-brasa rotate-0" : "bg-transparent rotate-0"
          }`}
        >
          {isOpen ? (
            <X className="w-4 h-4 text-crema" />
          ) : (
            <Plus className="w-4 h-4 text-carbon/40" />
          )}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          isOpen ? "max-h-60 pb-6" : "max-h-0"
        }`}
      >
        <p className="font-inter text-sm sm:text-base text-carbon/60 leading-relaxed pr-16">
          {faq.a}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const sectionRef = useRef(null);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".faq-item", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="faq" className="bg-cream py-24 sm:py-32">
      <div className="max-w-3xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-16">
          <span className="inline-block font-mono text-xs font-medium text-carbon/30 tracking-widest uppercase mb-4">
            Preguntas frecuentes
          </span>
          <h2 className="font-jakarta font-bold text-3xl sm:text-4xl text-carbon tracking-tight">
            Lo esencial para entender{" "}
            <span className="font-cormorant italic text-brasa">el negocio</span>
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-carbon/[0.06] p-6 sm:p-8">
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item">
              <FAQItem
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
