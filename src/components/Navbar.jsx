import { useState, useEffect } from 'react'
import { Flame } from 'lucide-react'

const navLinks = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Espacios', href: '#espacios' },
  { label: 'Precios', href: '#precios' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-4 sm:px-6 py-3 rounded-full transition-all duration-500 ease-out w-[calc(100%-2rem)] max-w-5xl ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-carbon/5 border border-brasa/10'
          : 'bg-transparent'
      }`}
    >
      {/* Logo */}
      <a href="#" className="flex items-center gap-2 group">
        <Flame
          className={`w-5 h-5 transition-colors duration-500 ${
            scrolled ? 'text-brasa' : 'text-brasa'
          }`}
          strokeWidth={2.5}
        />
        <span
          className={`font-jakarta font-extrabold text-lg tracking-tight transition-colors duration-500 ${
            scrolled ? 'text-carbon' : 'text-crema'
          }`}
        >
          Prende
        </span>
      </a>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={`font-jakarta text-sm font-medium transition-colors duration-300 hover:text-brasa ${
              scrolled ? 'text-carbon/70' : 'text-crema/80'
            }`}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTA + Mobile Toggle */}
      <div className="flex items-center gap-3">
        <a
          href="#reserva"
          className="hidden sm:inline-flex items-center gap-2 bg-brasa text-crema font-jakarta font-semibold text-sm px-5 py-2.5 rounded-full hover:translate-y-[-1px] hover:shadow-lg hover:shadow-brasa/20 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="relative z-10">Reservá</span>
          <span className="absolute inset-0 bg-gradient-to-r from-brasa to-[#e86030] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </a>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden flex flex-col gap-1.5 p-2 transition-colors ${
            scrolled ? 'text-carbon' : 'text-crema'
          }`}
          aria-label="Menú"
        >
          <span
            className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${
              mobileOpen ? 'rotate-45 translate-y-2' : ''
            } ${scrolled ? 'bg-carbon' : 'bg-crema'}`}
          />
          <span
            className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${
              mobileOpen ? 'opacity-0' : ''
            } ${scrolled ? 'bg-carbon' : 'bg-crema'}`}
          />
          <span
            className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${
              mobileOpen ? '-rotate-45 -translate-y-2' : ''
            } ${scrolled ? 'bg-carbon' : 'bg-crema'}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-brasa/10 p-6 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-jakarta text-base font-medium text-carbon/80 hover:text-brasa transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#reserva"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center bg-brasa text-crema font-jakarta font-semibold text-base px-6 py-3 rounded-full mt-2"
            >
              Reservá tu espacio
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
