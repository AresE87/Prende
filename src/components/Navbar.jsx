import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, User, ArrowRight } from "lucide-react";

const navLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Espacios", href: "#espacios" },
  { label: "Precios", href: "#precios" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed left-0 right-0 top-4 z-50 px-4 sm:px-6">
      <div className={`mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-3 transition duration-500 sm:px-5 ${scrolled ? "glass-shell shadow-[0_20px_44px_-30px_rgba(23,22,22,0.52)]" : "bg-transparent"}`}>
        <a href="#" className="flex items-center gap-3 rounded-full px-1 py-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#171616] text-[#f7f1e8] shadow-[0_16px_26px_-20px_rgba(23,22,22,0.85)]">
            <Flame size={18} />
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-[0.18em] ${scrolled ? "text-[#171616]/38" : "text-white/50"}`}>Marketplace</p>
            <p className={`text-lg font-semibold ${scrolled ? "text-[#171616]" : "text-white"}`}>Prende</p>
          </div>
        </a>

        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={`text-sm font-medium transition ${scrolled ? "text-[#171616]/68 hover:text-[#171616]" : "text-white/76 hover:text-white"}`}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <Link to="/login" className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${scrolled ? "text-[#171616]/72 hover:text-[#171616]" : "text-white/82 hover:text-white"}`}>
            <User size={14} />
            Entrar
          </Link>
          <a href="#reserva" className="inline-flex items-center gap-2 rounded-full bg-[#d5632a] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(213,99,42,0.82)] transition hover:-translate-y-0.5 hover:bg-[#c75424]">
            Reservar
            <ArrowRight size={14} />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className={`flex h-11 w-11 items-center justify-center rounded-full border transition sm:hidden ${scrolled ? "border-[#171616]/10 bg-white/80 text-[#171616]" : "border-white/14 bg-white/10 text-white backdrop-blur-sm"}`}
          aria-label="Menu"
        >
          <span className="relative block h-4 w-4">
            <span className={`absolute left-0 top-0 block h-0.5 w-4 rounded-full transition ${mobileOpen ? "translate-y-[7px] rotate-45" : ""} ${scrolled ? "bg-[#171616]" : "bg-white"}`} />
            <span className={`absolute left-0 top-[7px] block h-0.5 w-4 rounded-full transition ${mobileOpen ? "opacity-0" : ""} ${scrolled ? "bg-[#171616]" : "bg-white"}`} />
            <span className={`absolute left-0 top-[14px] block h-0.5 w-4 rounded-full transition ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""} ${scrolled ? "bg-[#171616]" : "bg-white"}`} />
          </span>
        </button>
      </div>

      {mobileOpen && (
        <div className="mx-auto mt-3 max-w-6xl sm:hidden">
          <div className="surface-card rounded-[30px] p-4">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block rounded-[20px] px-4 py-3 text-sm font-medium text-[#171616] transition hover:bg-[#171616]/4">
                  {link.label}
                </a>
              ))}
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-[20px] px-4 py-3 text-sm font-medium text-[#171616] transition hover:bg-[#171616]/4">
                <User size={15} /> Entrar
              </Link>
              <a href="#reserva" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-full bg-[#171616] px-5 py-3 text-sm font-semibold text-[#f7f1e8] shadow-[0_16px_28px_-20px_rgba(23,22,22,0.82)]">
                Reservar ahora
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
