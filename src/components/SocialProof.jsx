import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Quote } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const testimonials = [
  {
    before: 'Somos 12 y el quincho del edificio es para 6',
    after: 'Reservamos una terraza en Buceo para 20 personas. Increíble.',
    name: 'Martín',
    age: 34,
  },
  {
    before: 'Queríamos hacer un asado de cumple pero vivimos en monoambiente',
    after: 'Encontramos un espacio con parrillero y pileta por $1.800 las 4 horas.',
    name: 'Lucía',
    age: 29,
  },
  {
    before: 'El equipo de la oficina quería salir de la rutina',
    after: 'Hicimos un team building con asado en Carrasco. Mejor que cualquier after.',
    name: 'Sofía',
    age: 38,
  },
]

export default function SocialProof() {
  const sectionRef = useRef(null)
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [paused])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.sp-header', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const t = testimonials[current]

  return (
    <section ref={sectionRef} className="bg-carbon py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="sp-header text-center mb-16">
          <span className="inline-block font-mono text-xs font-medium text-crema/30 tracking-widest uppercase mb-4">
            Historias reales
          </span>
          <h2 className="font-jakarta font-bold text-3xl sm:text-4xl text-crema tracking-tight">
            Ellos ya{' '}
            <span className="font-cormorant italic text-brasa">prendieron.</span>
          </h2>
        </div>

        {/* Testimonial card */}
        <div
          className="relative bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 sm:p-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <Quote className="w-8 h-8 text-brasa/20 mb-6" />

          {/* Before */}
          <div className="mb-8">
            <span className="font-mono text-[10px] text-crema/30 tracking-widest uppercase block mb-2">
              La situación
            </span>
            <p className="font-inter text-lg text-crema/50 leading-relaxed italic">
              "{t.before}"
            </p>
          </div>

          {/* Divider */}
          <div className="w-16 h-px bg-brasa/30 mb-8" />

          {/* After */}
          <div className="mb-8">
            <span className="font-mono text-[10px] text-brasa/60 tracking-widest uppercase block mb-2">
              El resultado
            </span>
            <p className="font-jakarta text-xl sm:text-2xl font-semibold text-crema leading-snug">
              "{t.after}"
            </p>
          </div>

          {/* Author */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brasa/15 flex items-center justify-center">
              <span className="font-jakarta font-bold text-sm text-brasa">
                {t.name[0]}
              </span>
            </div>
            <div>
              <p className="font-jakarta font-semibold text-sm text-crema">{t.name}</p>
              <p className="font-mono text-xs text-crema/30">{t.age} años</p>
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex gap-2 mt-8 justify-center">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  i === current ? 'bg-brasa w-6' : 'bg-crema/20'
                }`}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
