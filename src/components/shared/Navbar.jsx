import { createElement, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Flame, ChevronDown, User, CalendarDays, LogOut, LayoutDashboard } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Avatar } from "./index";
import { signOut, supabaseConfigured } from "../../lib/supabase";

export default function Navbar() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isHost = location.pathname.startsWith("/anfitrion");

  async function handleLogout() {
    if (supabaseConfigured) {
      await signOut();
    }
    dispatch({ type: "LOGOUT" });
    navigate("/");
  }

  return (
    <nav className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#1C1917]/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#1C1917]">
          <Flame size={24} className="text-[#D4541B]" />
          <span>Prende</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {!isHost && (
            <Link to="/buscar" className="text-sm font-medium text-[#1C1917]/70 hover:text-[#1C1917] transition-colors font-['Inter']">
              Explorar espacios
            </Link>
          )}
          {state.user?.isHost && (
            <Link
              to="/anfitrion/dashboard"
              className="text-sm font-medium text-[#1C1917]/70 hover:text-[#1C1917] transition-colors font-['Inter']"
            >
              Mi espacio
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          {state.user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#1C1917]/8 transition-colors"
              >
                <Avatar src={state.user.avatar} name={state.user.name} size="sm" />
                <span className="text-sm font-medium text-[#1C1917] font-['Inter']">{state.user.name.split(" ")[0]}</span>
                <ChevronDown size={14} className="text-[#1C1917]/50" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#1C1917]/10 py-2 z-50">
                  <DropItem icon={User} label="Mi perfil" onClick={() => { navigate("/perfil"); setProfileOpen(false); }} />
                  <DropItem icon={CalendarDays} label="Mis reservas" onClick={() => { navigate("/mis-reservas"); setProfileOpen(false); }} />
                  {state.user.isHost && (
                    <DropItem icon={LayoutDashboard} label="Panel anfitrión" onClick={() => { navigate("/anfitrion/dashboard"); setProfileOpen(false); }} />
                  )}
                  <div className="my-1 border-t border-[#1C1917]/10" />
                  <DropItem icon={LogOut} label="Cerrar sesión" onClick={handleLogout} danger />
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-[#1C1917] hover:underline font-['Inter']">Entrar</Link>
              <Link
                to="/login?mode=register"
                className="bg-[#D4541B] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#B8441A] transition-colors font-['Inter']"
              >
                Publicar espacio
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-[#1C1917]/8">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#1C1917]/10 px-4 py-4 flex flex-col gap-3">
          <MobileLink to="/buscar" onClick={() => setMenuOpen(false)}>Explorar espacios</MobileLink>
          {state.user ? (
            <>
              <MobileLink to="/mis-reservas" onClick={() => setMenuOpen(false)}>Mis reservas</MobileLink>
              <MobileLink to="/perfil" onClick={() => setMenuOpen(false)}>Mi perfil</MobileLink>
              {state.user.isHost && (
                <MobileLink to="/anfitrion/dashboard" onClick={() => setMenuOpen(false)}>Panel anfitrión</MobileLink>
              )}
              <button onClick={handleLogout} className="text-left text-sm font-medium text-red-600 py-2 font-['Inter']">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <MobileLink to="/login" onClick={() => setMenuOpen(false)}>Entrar</MobileLink>
              <MobileLink to="/login?mode=register" onClick={() => setMenuOpen(false)}>Publicar espacio</MobileLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function DropItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-[#FAF7F2] transition-colors font-['Inter'] ${danger ? "text-red-600" : "text-[#1C1917]"}`}
    >
      {createElement(icon, { size: 16 })}
      {label}
    </button>
  );
}

function MobileLink({ to, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block text-sm font-medium text-[#1C1917] py-2 border-b border-[#1C1917]/8 font-['Inter']"
    >
      {children}
    </Link>
  );
}
