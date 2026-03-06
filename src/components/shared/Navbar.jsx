import { createElement, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Flame, ChevronDown, User, CalendarDays, LogOut, LayoutDashboard, Search, PlusCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Avatar, Badge } from "./index";
import { signOut, supabaseConfigured } from "../../lib/supabase";

export default function Navbar() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isHostArea = location.pathname.startsWith("/anfitrion");
  const firstName = useMemo(() => state.user?.name?.split(" ")[0] ?? "Perfil", [state.user?.name]);

  async function handleLogout() {
    if (supabaseConfigured) {
      await signOut();
    }
    dispatch({ type: "LOGOUT" });
    navigate("/");
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-[#171616]/8 bg-[#f7f1e8]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="glass-shell flex items-center gap-3 rounded-full px-4 py-2.5 transition hover:-translate-y-0.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171616] text-[#f7f1e8] shadow-[0_16px_28px_-22px_rgba(23,22,22,0.85)]">
            <Flame size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#171616]/40">Marketplace</p>
            <p className="text-lg font-bold text-[#171616]">Prende</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          <NavPill to="/buscar" active={location.pathname.startsWith("/buscar") || location.pathname.startsWith("/espacio") || location.pathname.startsWith("/reservar")} icon={Search}>
            Explorar
          </NavPill>
          {state.user?.isHost && (
            <NavPill to="/anfitrion/dashboard" active={isHostArea} icon={LayoutDashboard}>
              Anfitrion
            </NavPill>
          )}
          {!state.user?.isHost && (
            <Link to="/login?mode=register" className="inline-flex items-center gap-2 rounded-full border border-[#171616]/10 bg-white/80 px-4 py-2.5 text-sm font-medium text-[#171616] shadow-[0_12px_28px_-24px_rgba(23,22,22,0.6)] transition hover:-translate-y-0.5 hover:bg-white">
              <PlusCircle size={15} />
              Publicar espacio
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {state.user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((open) => !open)}
                className="glass-shell flex items-center gap-3 rounded-full px-3 py-2.5 transition hover:-translate-y-0.5"
              >
                <Avatar src={state.user.avatar} name={state.user.name} size="sm" />
                <div className="text-left">
                  <p className="text-xs text-[#171616]/45">Cuenta activa</p>
                  <p className="text-sm font-semibold text-[#171616]">{firstName}</p>
                </div>
                <ChevronDown size={16} className="text-[#171616]/50" />
              </button>

              {profileOpen && (
                <div className="surface-card absolute right-0 top-full mt-3 w-72 rounded-[28px] p-3">
                  <div className="rounded-[24px] bg-[#171616] px-4 py-4 text-[#f7f1e8]">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#f7f1e8]/48">Sesion</p>
                    <p className="mt-2 text-lg font-semibold">{state.user.name}</p>
                    <p className="mt-1 text-sm text-[#f7f1e8]/68">{state.user.email}</p>
                    {state.user.isHost && <Badge className="mt-3 border-white/10 bg-white/10 text-white">Host activo</Badge>}
                  </div>
                  <div className="mt-3 space-y-1">
                    <DropItem icon={User} label="Mi perfil" onClick={() => { navigate("/perfil"); setProfileOpen(false); }} />
                    <DropItem icon={CalendarDays} label="Mis reservas" onClick={() => { navigate("/mis-reservas"); setProfileOpen(false); }} />
                    {state.user.isHost && (
                      <DropItem icon={LayoutDashboard} label="Panel anfitrion" onClick={() => { navigate("/anfitrion/dashboard"); setProfileOpen(false); }} />
                    )}
                    <div className="my-2 h-px bg-[#171616]/8" />
                    <DropItem icon={LogOut} label="Cerrar sesion" onClick={handleLogout} danger />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-[#171616]/70 transition hover:text-[#171616]">
                Entrar
              </Link>
              <Link to="/login?mode=register" className="inline-flex items-center rounded-full bg-[#171616] px-5 py-3 text-sm font-semibold text-[#f7f1e8] shadow-[0_16px_28px_-20px_rgba(23,22,22,0.82)] transition hover:-translate-y-0.5 hover:bg-[#24211f]">
                Crear cuenta
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#171616]/10 bg-white/75 text-[#171616] shadow-[0_12px_30px_-24px_rgba(23,22,22,0.65)] md:hidden"
          aria-label="Menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {menuOpen && (
        <div className="px-4 pb-4 md:hidden sm:px-6">
          <div className="surface-card rounded-[28px] p-4">
            <div className="space-y-2">
              <MobileLink to="/buscar" onClick={() => setMenuOpen(false)} icon={Search}>Explorar espacios</MobileLink>
              {state.user ? (
                <>
                  <MobileLink to="/mis-reservas" onClick={() => setMenuOpen(false)} icon={CalendarDays}>Mis reservas</MobileLink>
                  <MobileLink to="/perfil" onClick={() => setMenuOpen(false)} icon={User}>Mi perfil</MobileLink>
                  {state.user.isHost && (
                    <MobileLink to="/anfitrion/dashboard" onClick={() => setMenuOpen(false)} icon={LayoutDashboard}>Panel anfitrion</MobileLink>
                  )}
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50">
                    <LogOut size={16} />
                    Cerrar sesion
                  </button>
                </>
              ) : (
                <>
                  <MobileLink to="/login" onClick={() => setMenuOpen(false)} icon={User}>Entrar</MobileLink>
                  <MobileLink to="/login?mode=register" onClick={() => setMenuOpen(false)} icon={PlusCircle}>Publicar espacio</MobileLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavPill({ to, active, icon, children }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${active ? "bg-[#171616] text-[#f7f1e8] shadow-[0_16px_28px_-20px_rgba(23,22,22,0.82)]" : "text-[#171616]/70 hover:bg-white/70 hover:text-[#171616]"}`}
    >
      {createElement(icon, { size: 15 })}
      {children}
    </Link>
  );
}

function DropItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left text-sm font-medium transition ${danger ? "text-red-600 hover:bg-red-50" : "text-[#171616] hover:bg-[#171616]/4"}`}
    >
      {createElement(icon, { size: 16 })}
      {label}
    </button>
  );
}

function MobileLink({ to, children, onClick, icon }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-medium text-[#171616] transition hover:bg-[#171616]/4">
      {createElement(icon, { size: 16 })}
      {children}
    </Link>
  );
}
