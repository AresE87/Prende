import { Flame } from 'lucide-react'

const footerLinks = {
  Producto: [
    { label: 'Espacios', href: '#espacios' },
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'Precios', href: '#precios' },
    { label: 'FAQ', href: '#faq' },
  ],
  Contacto: [
    { label: 'Instagram', href: '#' },
    { label: 'WhatsApp', href: '#' },
    { label: 'TikTok', href: '#' },
    { label: 'hola@prende.uy', href: 'mailto:hola@prende.uy' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-carbon rounded-t-[3rem] pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid sm:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-brasa" strokeWidth={2.5} />
              <span className="font-jakarta font-extrabold text-lg text-crema tracking-tight">
                Prende
              </span>
            </div>
            <p className="font-inter text-sm text-crema/40 leading-relaxed mb-6">
              Donde se hace el asado.
            </p>
            {/* Platform status */}
            <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-2">
              <span className="font-mono text-[10px] text-crema/30">Plataforma</span>
              <span className="w-1.5 h-1.5 rounded-full bg-oliva animate-pulse" />
              <span className="font-mono text-[10px] text-oliva">Activa</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-jakarta font-semibold text-sm text-crema/60 mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="font-inter text-sm text-crema/30 hover:text-brasa transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-inter text-xs text-crema/20">
            © 2026 Prende · Montevideo, Uruguay
          </p>
          <p className="font-inter text-xs text-crema/20">
            Hecho con fuego y código 🔥
          </p>
        </div>
      </div>
    </footer>
  )
}
