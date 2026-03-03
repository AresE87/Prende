import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Home, Users, AlertCircle, MapPin, Clock, Flame } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const problems = [
  { icon: Home, text: 'Vivís en un apartamento sin parrillero' },
  { icon: AlertCircle, text: 'Las barbacoas del edificio están siempre reservadas' },
  { icon: Users, text: 'Organizar en casa para +8 personas es un caos' },
]

const solutions = [
  { icon: MapPin, text: 'Elegí entre +80 espacios con parrilla en Montevideo' },
  { icon: Clock, text: 'Reservá por hora, sin contratos ni depósitos enormes' },
  { icon: Flame, text: 'Llegá, prendé el fuego y disfrutá con tu gente' },
]

export default function ProblemSolution() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.ps-left', {
        x: -40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      })

      gsap.from('.ps-right', {
        x: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-cream py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          {/* Problem */}
          <div>
            <span className="ps-left inline-block font-mono text-xs font-medium text-carbon/40 tracking-widest uppercase mb-4">
              El problema
            </span>
            <h2 className="ps-left font-jakarta font-bold text-2xl sm:text-3xl text-carbon mb-8 tracking-tight">
              ¿Te suena conocido?
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

          {/* Solution */}
          <div>
            <span className="ps-right inline-block font-mono text-xs font-medium text-brasa/60 tracking-widest uppercase mb-4">
              La solución
            </span>
            <h2 className="ps-right font-jakarta font-bold text-2xl sm:text-3xl text-carbon mb-8 tracking-tight">
              Con{' '}
              <span className="font-cormorant italic text-brasa text-3xl sm:text-4xl">Prende</span>
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
  )
}
