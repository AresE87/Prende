import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Manifesto() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.mani-line', {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 65%',
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative bg-carbon py-24 sm:py-32 overflow-hidden">
      {/* Background image with parallax feel */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80&auto=format&fit=crop"
          alt="Mesa con comida vista cenital"
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-carbon/80" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
        {/* Comparison block 1 */}
        <div className="mb-16">
          <div className="mani-line flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-crema/30 tracking-widest uppercase">
              Lo normal es:
            </span>
          </div>
          <p className="mani-line font-inter text-xl sm:text-2xl text-crema/40 leading-relaxed">
            preguntar en 5 grupos de WhatsApp quién tiene parrillero
          </p>
        </div>

        {/* Divider */}
        <div className="mani-line w-24 h-px bg-brasa/40 mb-16" />

        {/* Comparison block 2 */}
        <div>
          <div className="mani-line flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-brasa tracking-widest uppercase">
              Con Prende:
            </span>
          </div>
          <p className="mani-line font-jakarta font-bold text-3xl sm:text-4xl md:text-5xl text-crema leading-tight tracking-tight">
            reservás en 2 minutos y solo llevás{' '}
            <span className="font-cormorant italic text-brasa">la carne</span>
          </p>
        </div>
      </div>
    </section>
  )
}
