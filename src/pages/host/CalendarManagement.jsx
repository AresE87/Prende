import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Button, Card, PageContainer, SectionTitle } from "../../components/shared";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Mock blocked dates
const BLOCKED = new Set(["2025-03-20","2025-03-21","2025-03-28"]);
// Mock booked dates
const BOOKED = new Set(["2025-03-15","2025-03-18","2025-03-22"]);

export default function CalendarManagement() {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDates, setSelectedDates] = useState([]);
  const [mode, setMode] = useState("block"); // block | unblock

  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();

  function dateKey(day) {
    return `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function toggleDate(day) {
    const key = dateKey(day);
    if (BOOKED.has(key)) return; // can't modify booked dates
    setSelectedDates((p) =>
      p.includes(key) ? p.filter((d) => d !== key) : [...p, key]
    );
  }

  function applyAction() {
    if (mode === "block") {
      selectedDates.forEach((d) => BLOCKED.add(d));
    } else {
      selectedDates.forEach((d) => BLOCKED.delete(d));
    }
    setSelectedDates([]);
  }

  function prevMonth() {
    setCurrent((p) => p.month === 0
      ? { year: p.year - 1, month: 11 }
      : { ...p, month: p.month - 1 }
    );
  }
  function nextMonth() {
    setCurrent((p) => p.month === 11
      ? { year: p.year + 1, month: 0 }
      : { ...p, month: p.month + 1 }
    );
  }

  return (
    <PageContainer>
      <SectionTitle sub="Bloqueá y desbloqueá fechas para tu espacio">Gestión de disponibilidad</SectionTitle>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-[#FAF7F2] transition-colors">
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">
                {MONTHS[current.month]} {current.year}
              </h3>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-[#FAF7F2] transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-bold text-[#1C1917]/40 py-2 font-['Inter']">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const key = dateKey(day);
                const isBlocked  = BLOCKED.has(key);
                const isBooked   = BOOKED.has(key);
                const isSelected = selectedDates.includes(key);
                const isPast     = new Date(key) < today && !isToday(key);

                function isToday(k) {
                  return k === today.toISOString().split("T")[0];
                }

                return (
                  <button
                    key={day}
                    onClick={() => !isPast && toggleDate(day)}
                    disabled={isPast || isBooked}
                    className={[
                      "aspect-square rounded-xl text-sm font-medium transition-all font-['JetBrains_Mono']",
                      isPast     ? "text-[#1C1917]/20 cursor-not-allowed" : "cursor-pointer",
                      isBooked   ? "bg-[#4A5E3A]/20 text-[#4A5E3A] cursor-not-allowed" : "",
                      isBlocked  && !isSelected ? "bg-red-100 text-red-400" : "",
                      isSelected ? "bg-[#D4541B] text-white shadow-lg scale-105" : "",
                      !isBooked && !isBlocked && !isSelected && !isPast ? "hover:bg-[#FAF7F2]" : "",
                      isToday(key) ? "ring-2 ring-[#D4541B]" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-[#1C1917]/10">
              {[
                { color: "bg-[#4A5E3A]/20 text-[#4A5E3A]", label: "Reservado" },
                { color: "bg-red-100 text-red-400",          label: "Bloqueado" },
                { color: "bg-[#D4541B] text-white",          label: "Seleccionado" },
                { color: "bg-white ring-2 ring-[#D4541B]",   label: "Hoy" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center ${color}`}>•</span>
                  <span className="text-xs text-[#1C1917]/60 font-['Inter']">{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Actions panel */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-3">Acción seleccionada</h3>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode("block")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all font-['Inter'] ${mode === "block" ? "bg-red-100 text-red-600 border border-red-200" : "bg-[#FAF7F2] text-[#1C1917]/60 border border-[#1C1917]/10"}`}
              >
                🚫 Bloquear
              </button>
              <button
                onClick={() => setMode("unblock")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all font-['Inter'] ${mode === "unblock" ? "bg-[#4A5E3A]/15 text-[#4A5E3A] border border-[#4A5E3A]/30" : "bg-[#FAF7F2] text-[#1C1917]/60 border border-[#1C1917]/10"}`}
              >
                ✅ Desbloquear
              </button>
            </div>

            {selectedDates.length > 0 ? (
              <>
                <div className="bg-[#FAF7F2] rounded-xl p-3 mb-3 max-h-36 overflow-y-auto">
                  {selectedDates.map((d) => (
                    <div key={d} className="flex items-center justify-between py-1">
                      <span className="text-xs text-[#1C1917] font-['JetBrains_Mono']">{d}</span>
                      <button onClick={() => setSelectedDates((p) => p.filter((x) => x !== d))}>
                        <X size={12} className="text-[#1C1917]/40 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button fullWidth onClick={applyAction}>
                  {mode === "block" ? "🚫 Bloquear" : "✅ Desbloquear"} {selectedDates.length} fecha{selectedDates.length > 1 ? "s" : ""}
                </Button>
                <button
                  onClick={() => setSelectedDates([])}
                  className="w-full text-xs text-[#1C1917]/40 mt-2 hover:text-[#1C1917] font-['Inter']"
                >
                  Limpiar selección
                </button>
              </>
            ) : (
              <p className="text-sm text-[#1C1917]/40 text-center py-3 font-['Inter']">
                Hacé clic en las fechas del calendario para seleccionarlas
              </p>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-3">Horarios disponibles</h3>
            <p className="text-xs text-[#1C1917]/50 font-['Inter'] mb-3">Configurá los horarios en que tu espacio está disponible</p>
            <div className="space-y-2">
              {["Lunes–Viernes", "Sábados", "Domingos"].map((day) => (
                <div key={day} className="flex items-center justify-between">
                  <span className="text-sm text-[#1C1917] font-['Inter']">{day}</span>
                  <span className="text-xs font-['JetBrains_Mono'] text-[#D4541B] font-semibold">10:00–22:00</span>
                </div>
              ))}
            </div>
            <Button variant="outline" fullWidth size="sm" className="mt-4">
              Editar horarios
            </Button>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
