import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button, Card, PageContainer, SectionTitle, Skeleton } from "../../components/shared";
import { useApp } from "../../context/AppContext";
import { supabase, supabaseConfigured } from "../../lib/supabase";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function CalendarManagement() {
  const { state } = useApp();
  const user = state.user;
  const today = new Date();

  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDates, setSelectedDates] = useState([]);
  const [mode, setMode] = useState("block");

  const [spaceId, setSpaceId] = useState(null);
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [bookedDates, setBookedDates] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState([]);

  // Load host's first space
  useEffect(() => {
    if (!supabaseConfigured || !user) return;

    let cancelled = false;

    async function loadSpace() {
      const { data } = await supabase
        .from("spaces")
        .select("id")
        .eq("host_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (!cancelled && data) {
        setSpaceId(data.id);
      } else if (!cancelled) {
        setLoading(false);
      }
    }

    loadSpace();
    return () => { cancelled = true; };
  }, [user]);

  // Load blocked dates, booked dates, and availability when space or month changes
  const loadCalendarData = useCallback(async () => {
    if (!spaceId) return;

    setLoading(true);

    const monthStart = `${current.year}-${String(current.month + 1).padStart(2, "0")}-01`;
    const nextMonth = current.month === 11
      ? `${current.year + 1}-01-01`
      : `${current.year}-${String(current.month + 2).padStart(2, "0")}-01`;

    try {
      const [blockedRes, bookedRes, availRes] = await Promise.all([
        supabase
          .from("space_blocked_dates")
          .select("blocked_date")
          .eq("space_id", spaceId)
          .gte("blocked_date", monthStart)
          .lt("blocked_date", nextMonth),
        supabase
          .from("bookings")
          .select("date")
          .eq("space_id", spaceId)
          .in("status", ["paid", "confirmed"])
          .gte("date", monthStart)
          .lt("date", nextMonth),
        supabase
          .from("space_availability")
          .select("day_of_week, open_time, close_time")
          .eq("space_id", spaceId),
      ]);

      setBlockedDates(new Set((blockedRes.data ?? []).map((r) => r.blocked_date)));
      setBookedDates(new Set((bookedRes.data ?? []).map((r) => r.date)));
      setAvailability(availRes.data ?? []);
    } catch (err) {
      console.error("Error cargando calendario:", err);
    } finally {
      setLoading(false);
    }
  }, [spaceId, current.year, current.month]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();

  function dateKey(day) {
    return `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function toggleDate(day) {
    const key = dateKey(day);
    if (bookedDates.has(key)) return;
    setSelectedDates((p) =>
      p.includes(key) ? p.filter((d) => d !== key) : [...p, key]
    );
  }

  async function applyAction() {
    if (!spaceId || selectedDates.length === 0) return;

    setSaving(true);

    try {
      if (mode === "block") {
        const rows = selectedDates
          .filter((d) => !blockedDates.has(d))
          .map((d) => ({ space_id: spaceId, blocked_date: d }));

        if (rows.length > 0) {
          const { error } = await supabase
            .from("space_blocked_dates")
            .upsert(rows, { onConflict: "space_id,blocked_date" });
          if (error) throw error;
        }
      } else {
        const toUnblock = selectedDates.filter((d) => blockedDates.has(d));
        if (toUnblock.length > 0) {
          const { error } = await supabase
            .from("space_blocked_dates")
            .delete()
            .eq("space_id", spaceId)
            .in("blocked_date", toUnblock);
          if (error) throw error;
        }
      }

      setSelectedDates([]);
      await loadCalendarData();
    } catch (err) {
      console.error("Error actualizando disponibilidad:", err);
    } finally {
      setSaving(false);
    }
  }

  function prevMonth() {
    setCurrent((p) => p.month === 0
      ? { year: p.year - 1, month: 11 }
      : { ...p, month: p.month - 1 }
    );
    setSelectedDates([]);
  }
  function nextMonth() {
    setCurrent((p) => p.month === 11
      ? { year: p.year + 1, month: 0 }
      : { ...p, month: p.month + 1 }
    );
    setSelectedDates([]);
  }

  if (!spaceId && !loading) {
    return (
      <PageContainer>
        <SectionTitle sub="Primero necesitás publicar un espacio">Gestión de disponibilidad</SectionTitle>
        <Card className="p-8 text-center">
          <p className="text-[#1C1917]/50 font-['Inter'] mb-4">No tenés espacios publicados todavía.</p>
          <Button onClick={() => window.location.href = "/anfitrion/onboarding"}>Publicar mi espacio</Button>
        </Card>
      </PageContainer>
    );
  }

  // Build availability display from real data
  const dayLabels = { 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado", 0: "Domingo" };
  const availGroups = [];
  if (availability.length > 0) {
    const weekdays = availability.filter((a) => a.day_of_week >= 1 && a.day_of_week <= 5);
    const saturday = availability.find((a) => a.day_of_week === 6);
    const sunday = availability.find((a) => a.day_of_week === 0);

    if (weekdays.length > 0) {
      const first = weekdays[0];
      availGroups.push({ label: "Lunes–Viernes", time: `${first.open_time.slice(0, 5)}–${first.close_time.slice(0, 5)}` });
    }
    if (saturday) availGroups.push({ label: "Sábados", time: `${saturday.open_time.slice(0, 5)}–${saturday.close_time.slice(0, 5)}` });
    if (sunday) availGroups.push({ label: "Domingos", time: `${sunday.open_time.slice(0, 5)}–${sunday.close_time.slice(0, 5)}` });
  }

  if (availGroups.length === 0) {
    availGroups.push(
      { label: "Lunes–Viernes", time: "10:00–22:00" },
      { label: "Sábados", time: "10:00–22:00" },
      { label: "Domingos", time: "10:00–22:00" },
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
            {loading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`e${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const key = dateKey(day);
                  const isBlocked  = blockedDates.has(key);
                  const isBooked   = bookedDates.has(key);
                  const isSelected = selectedDates.includes(key);
                  const todayKey   = today.toISOString().split("T")[0];
                  const isPast     = key < todayKey;
                  const isToday    = key === todayKey;

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
                        isToday ? "ring-2 ring-[#D4541B]" : "",
                      ].filter(Boolean).join(" ")}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            )}

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
                Bloquear
              </button>
              <button
                onClick={() => setMode("unblock")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all font-['Inter'] ${mode === "unblock" ? "bg-[#4A5E3A]/15 text-[#4A5E3A] border border-[#4A5E3A]/30" : "bg-[#FAF7F2] text-[#1C1917]/60 border border-[#1C1917]/10"}`}
              >
                Desbloquear
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
                <Button fullWidth onClick={applyAction} loading={saving}>
                  {saving ? "Guardando..." : `${mode === "block" ? "Bloquear" : "Desbloquear"} ${selectedDates.length} fecha${selectedDates.length > 1 ? "s" : ""}`}
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
            <p className="text-xs text-[#1C1917]/50 font-['Inter'] mb-3">Horarios en que tu espacio está disponible</p>
            <div className="space-y-2">
              {availGroups.map((group) => (
                <div key={group.label} className="flex items-center justify-between">
                  <span className="text-sm text-[#1C1917] font-['Inter']">{group.label}</span>
                  <span className="text-xs font-['JetBrains_Mono'] text-[#D4541B] font-semibold">{group.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
