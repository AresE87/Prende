import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Users, Utensils, Waves, Check } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const plans = [
  {
    name: 'Rápido',
    price: '$800',
    unit: '/h',
    icon: Users,
    highlighted: false,
    features: [
      'Barbacoa básica con parrilla',
      'Capacidad hasta 8 personas',
      '2 horas mínimo',
      'Mesa y sillas incluidas',
    ],
  },
  {
    name: 'Clásico',
    price: '$1.200',
    unit: '/h',
    icon: Utensils,
    highlighted: true,
    features: [
      'Quincho equipado con parrilla',
      'Capacidad hasta 15 personas',
      'Vajilla incluida',
      '3 horas mínimo',
    ],
  },
  {
    name: 'Premium',
    price: '$1.800',
    unit: '/h',
    icon: Waves,
    highlighted: false,
    features: [
      'Terraza con parrilla y pileta',
      'Capacidad hasta 25 personas',
      'Mobiliario completo',
      '4 horas mínimo',
    ],
  },
]

export default function Pricing() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.price-card', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="precios" className="bg-cream py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block font-mono text-xs font-medium text-carbon/30 tracking-widest uppercase mb-4">
            Precios
          </span>
          <h2 className="font-jakarta font-bold text-3xl sm:text-4xl md:text-5xl text-carbon tracking-tight">
            Elegí tu{' '}
            <span className="font-cormorant italic text-brasa">estilo de asado</span>
          </h2>
          <p className="font-inter text-base text-carbon/50 mt-4 max-w-md mx-auto">
            Sin depósito. Cancelación gratis hasta 24h antes.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`price-card relative rounded-3xl p-8 flex flex-col transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-brasa text-crema shadow-xl shadow-brasa/15 md:scale-105 md:-my-4'
                  : 'bg-white border border-carbon/[0.06] text-carbon'
              }`}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-carbon text-crema font-mono text-[10px] tracking-widest uppercase px-4 py-1 rounded-full">
                  Popular
                </span>
              )}

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                  plan.highlighted ? 'bg-white/15' : 'bg-brasa/10'
                }`}
              >
                <plan.icon
                  className={`w-5 h-5 ${plan.highlighted ? 'text-crema' : 'text-brasa'}`}
                />
              </div>

              {/* Plan name */}
              <h3
                className={`font-jakarta font-bold text-lg mb-2 ${
                  plan.highlighted ? 'text-crema' : 'text-carbon'
                }`}
              >
                {plan.name}
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-jakarta font-extrabold text-4xl">
                  {plan.price}
                </span>
                <span
                  className={`font-inter text-sm ${
                    plan.highlighted ? 'text-crema/60' : 'text-carbon/40'
                  }`}
                >
                  {plan.unit}
                </span>
              </div>

              {/* Features list */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? 'text-crema/70' : 'text-brasa'
                      }`}
                    />
                    <span
                      className={`font-inter text-sm leading-relaxed ${
                        plan.highlighted ? 'text-crema/80' : 'text-carbon/60'
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="#reserva"
                className={`block w-full text-center font-jakarta font-bold text-sm py-3.5 rounded-full transition-all duration-300 hover:translate-y-[-1px] hover:shadow-lg ${
                  plan.highlighted
                    ? 'bg-crema text-brasa hover:shadow-crema/20'
                    : 'bg-brasa text-crema hover:shadow-brasa/20'
                }`}
              >
                Reservá ahora
              </a>
            </div>
          ))}
        </div>

        {/* Microcopy */}
        <p className="text-center font-inter text-xs text-carbon/40 mt-8">
          Sin depósito. Cancelación gratis hasta 24h antes. Precios en pesos uruguayos.
        </p>
      </div>
    </section>
  )
}
