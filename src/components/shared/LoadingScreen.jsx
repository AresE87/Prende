import { Flame } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="page-ambient flex min-h-[60vh] items-center justify-center px-4">
      <div className="surface-card flex w-full max-w-sm flex-col items-center rounded-[32px] px-8 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#171616_0%,#2f2b27_100%)] shadow-[0_24px_40px_-26px_rgba(23,22,22,0.9)]">
          <Flame size={28} className="animate-pulse text-[#f7f1e8]" />
        </div>
        <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.22em] text-[#171616]/40">Cargando</p>
        <h2 className="mt-2 font-display text-4xl text-[#171616]">Preparando la experiencia</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#171616]/58">
          Estamos trayendo disponibilidad, precios y datos del espacio.
        </p>
      </div>
    </div>
  );
}
