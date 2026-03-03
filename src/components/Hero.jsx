import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Flame, ArrowDown } from 'lucide-react'

export default function Hero() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.8, delay: 0.3 })
        .from('.hero-title-line', { y: 40, opacity: 0, duration: 0.9, stagger: 0.15 }, '-=0.4')
        .from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.7 }, '-=0.4')
        .from('.hero-cta', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.3')
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-[100dvh] min-h-[600px] flex items-end overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=80&auto=format&fit=crop"
          alt="Amigos disfrutando de un asado al aire libre"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-carbon/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 pb-16 sm:pb-24">
        {/* Authority badge */}
        <div className="hero-badge inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 mb-8">
          <Flame className="w-4 h-4 text-brasa" />
          <span className="font-jakarta text-xs sm:text-sm font-medium text-crema/90">
            Más de 80 espacios disponibles en Montevideo
          </span>
        </div>

        {/* Title */}
        <h1 className="max-w-3xl mb-6">
          <span className="hero-title-line block font-jakarta font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-crema leading-[1.1] tracking-tight">
            ¿Dónde hacemos el
          </span>
          <span className="hero-title-line block font-cormorant italic text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-brasa leading-[1.05] mt-1">
            asado?
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle font-inter text-base sm:text-lg text-crema/70 max-w-lg mb-10 leading-relaxed">
          Reservá una barbacoa, quincho o terraza por hora en Montevideo. Sin vueltas.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4">
          <a
            href="#reserva"
            className="hero-cta inline-flex items-center gap-2 bg-brasa text-crema font-jakarta font-bold text-base px-8 py-4 rounded-full hover:translate-y-[-2px] hover:shadow-xl hover:shadow-brasa/25 transition-all duration-300 relative overflow-hidden group"
          >
            <span className="relative z-10">Reservá tu espacio</span>
            <span className="absolute inset-0 bg-gradient-to-r from-[#e86030] to-brasa opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <a
            href="#como-funciona"
            className="hero-cta inline-flex items-center gap-2 border border-crema/30 text-crema font-jakarta font-semibold text-base px-8 py-4 rounded-full hover:bg-crema/10 hover:border-crema/50 transition-all duration-300"
          >
            Cómo funciona
            <ArrowDown className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
