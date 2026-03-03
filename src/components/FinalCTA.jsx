import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flame } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function FinalCTA() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cta-content > *', {
        y: 30,
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
    <section ref={sectionRef} id="reserva" className="bg-carbon py-24 sm:py-32">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center cta-content">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brasa/10 mb-8">
          <Flame className="w-7 h-7 text-brasa" />
        </div>

        {/* Title */}
        <h2 className="font-jakarta font-bold text-3xl sm:text-4xl md:text-5xl text-crema tracking-tight mb-6 leading-tight">
          El próximo asado es en{' '}
          <span className="font-cormorant italic text-brasa">Prende.</span>
        </h2>

        {/* Subtitle */}
        <p className="font-inter text-base sm:text-lg text-crema/50 mb-10 max-w-md mx-auto leading-relaxed">
          Reservá en 2 minutos. Sin compromiso. Solo llevá las ganas.
        </p>

        {/* CTA button */}
        <a
          href="#reserva"
          className="inline-flex items-center gap-2 bg-brasa text-crema font-jakarta font-bold text-lg px-10 py-5 rounded-full hover:translate-y-[-2px] hover:shadow-xl hover:shadow-brasa/25 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="relative z-10">Reservá tu espacio</span>
          <span className="absolute inset-0 bg-gradient-to-r from-[#e86030] to-brasa opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </a>

        {/* Microcopy */}
        <p className="font-inter text-xs text-crema/30 mt-6">
          Más de 80 espacios · Sin depósito · Cancelación gratis
        </p>
      </div>
    </section>
  )
}
