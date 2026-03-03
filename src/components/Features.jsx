import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ========== Feature 1: Map ========== */
function MapFeature() {
  const ref = useRef(null)

  const pins = [
    { label: 'Pocitos', price: 'desde $800/h', x: '35%', y: '55%' },
    { label: 'Punta Carretas', price: 'desde $1.200/h', x: '25%', y: '42%' },
    { label: 'Carrasco', price: 'desde $1.500/h', x: '70%', y: '35%' },
  ]

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.map-pin', {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        stagger: 0.2,
        ease: 'back.out(1.7)',
        scrollTrigger: { trigger: ref.current, start: 'top 75%' },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="relative bg-carbon rounded-3xl p-8 overflow-hidden min-h-[340px]">
      {/* Fake map background grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F5F0E8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Coastline hint */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300" preserveAspectRatio="none">
        <path d="M0,200 Q100,150 200,180 Q300,210 400,160 L400,300 L0,300 Z" fill="#4A5E3A" />
      </svg>

      {/* Pins */}
      {pins.map((pin, i) => (
        <div
          key={i}
          className="map-pin absolute flex flex-col items-center"
          style={{ left: pin.x, top: pin.y }}
        >
          {/* Pulse ring */}
          <span className="absolute w-8 h-8 rounded-full bg-brasa/20 animate-ping" />
          {/* Pin dot */}
          <span className="relative w-4 h-4 rounded-full bg-brasa shadow-lg shadow-brasa/30" />
          {/* Label */}
          <div className="mt-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 whitespace-nowrap">
            <p className="font-jakarta text-xs font-semibold text-crema">{pin.label}</p>
            <p className="font-mono text-[10px] text-crema/50">{pin.price}</p>
          </div>
        </div>
      ))}

      {/* Title overlay */}
      <div className="relative z-10">
        <span className="font-mono text-[10px] text-crema/30 tracking-widest uppercase">
          Feature
        </span>
        <h3 className="font-jakarta font-bold text-xl text-crema mt-1">Mapa de espacios</h3>
        <p className="font-inter text-sm text-crema/40 mt-2 max-w-[200px]">
          Explorá por zona y encontrá el espacio ideal cerca tuyo.
        </p>
      </div>
    </div>
  )
}

/* ========== Feature 2: Availability Calendar ========== */
function AvailabilityFeature() {
  const ref = useRef(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top 75%' },
        delay: 0.5,
      })

      tl.to({}, {
        duration: 0.8,
        onComplete: () => setSelectedDay(5), // Saturday
      })
        .to({}, {
          duration: 0.6,
          onComplete: () => setConfirmed(true),
        })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="relative bg-carbon rounded-3xl p-8 overflow-hidden min-h-[340px]">
      <span className="font-mono text-[10px] text-crema/30 tracking-widest uppercase">
        Feature
      </span>
      <h3 className="font-jakarta font-bold text-xl text-crema mt-1 mb-6">
        Disponibilidad en vivo
      </h3>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {days.map((day, i) => (
          <div key={i} className="text-center">
            <span className="font-mono text-[10px] text-crema/30 block mb-2">{day}</span>
            <div
              className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-500 ${
                selectedDay === i
                  ? 'bg-brasa text-crema scale-105 shadow-lg shadow-brasa/20'
                  : i === 6
                    ? 'bg-white/[0.03] text-crema/20'
                    : 'bg-white/[0.03] text-crema/30'
              }`}
            >
              <span className="font-mono text-xs">{10 + i}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Time slots */}
      <div className="flex gap-2 mb-6">
        {['10:00', '13:00', '16:00', '19:00'].map((t, i) => (
          <div
            key={t}
            className={`flex-1 py-2 rounded-xl text-center font-mono text-xs transition-all duration-500 ${
              i === 2 && selectedDay !== null
                ? 'bg-brasa/20 text-brasa border border-brasa/30'
                : 'bg-white/[0.03] text-crema/20'
            }`}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Confirm button */}
      <button
        className={`w-full py-3 rounded-xl font-jakarta font-semibold text-sm transition-all duration-500 ${
          confirmed
            ? 'bg-brasa text-crema shadow-lg shadow-brasa/20'
            : 'bg-white/[0.06] text-crema/30'
        }`}
      >
        {confirmed ? '✓ Reserva confirmada' : 'Confirmar reserva'}
      </button>
    </div>
  )
}

/* ========== Feature 3: Telemetry ========== */
function TelemetryFeature() {
  const ref = useRef(null)
  const [lineIndex, setLineIndex] = useState(0)

  const lines = [
    'Buscando espacios cerca de Pocitos…',
    '3 barbacoas disponibles este sábado…',
    'Comparando precios y capacidades…',
    'Reserva confirmada. ¡A prender el fuego!',
  ]

  useEffect(() => {
    let mounted = true
    const cycle = () => {
      if (!mounted) return
      setLineIndex((prev) => (prev + 1) % lines.length)
    }
    const interval = setInterval(cycle, 2500)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div ref={ref} className="relative bg-carbon rounded-3xl p-8 overflow-hidden min-h-[340px] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[10px] text-crema/30 tracking-widest uppercase">
          Feature
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <span className="w-2 h-2 rounded-full bg-oliva animate-pulse" />
          <span className="font-mono text-[10px] text-oliva">En vivo</span>
        </div>
      </div>

      <h3 className="font-jakarta font-bold text-xl text-crema mb-6">
        Telemetría de reservas
      </h3>

      {/* Terminal */}
      <div className="flex-1 bg-black/30 rounded-2xl p-5 font-mono text-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-3 h-3 rounded-full bg-red-500/60" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <span className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>

        <div className="space-y-2">
          {lines.slice(0, lineIndex + 1).map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-brasa/60 select-none">›</span>
              <span
                className={`${
                  i === lineIndex ? 'text-crema' : 'text-crema/30'
                } transition-colors duration-300`}
              >
                {line}
              </span>
            </div>
          ))}
          {/* Cursor */}
          <div className="flex items-center gap-2">
            <span className="text-brasa/60 select-none">›</span>
            <span className="w-2 h-4 bg-brasa animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ========== Main Features Section ========== */
export default function Features() {
  const sectionRef = useRef(null)

  return (
    <section ref={sectionRef} id="espacios" className="bg-cream py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block font-mono text-xs font-medium text-carbon/30 tracking-widest uppercase mb-4">
            Paneles funcionales
          </span>
          <h2 className="font-jakarta font-bold text-3xl sm:text-4xl md:text-5xl text-carbon tracking-tight">
            No te contamos.{' '}
            <span className="font-cormorant italic text-brasa">Te mostramos.</span>
          </h2>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MapFeature />
          <AvailabilityFeature />
          <TelemetryFeature />
        </div>
      </div>
    </section>
  )
}
