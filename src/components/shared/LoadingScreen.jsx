import { Flame } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Flame size={36} className="text-[#D4541B] animate-pulse" />
        </div>
        <p className="text-sm text-[#1C1917]/50 font-['Inter']">Cargando...</p>
      </div>
    </div>
  );
}
