import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button, Card, StatusBadge, Badge, PageContainer, SectionTitle, Skeleton, EmptyState } from "../../components/shared";
import { formatUYU, formatDate } from "../../lib/utils";
import { getMyBookings } from "../../lib/supabase";

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes" },
  { id: "paid", label: "Pagadas" },
  { id: "confirmed", label: "Confirmadas" },
  { id: "completed", label: "Completadas" },
  { id: "cancelled", label: "Canceladas" },
];

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400";

export function BookingManagement() {
  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHostBookings() {
      setLoading(true);
      setError("");

      try {
        const data = await getMyBookings("host");
        if (!cancelled) setBookings(data);
      } catch (err) {
        console.error("Error cargando reservas host:", err);
        if (!cancelled) setError("No pudimos cargar tus reservas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHostBookings();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = filter === "all"
    ? bookings
    : bookings.filter((booking) => booking.status === filter);

  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;

  return (
    <PageContainer>
      <SectionTitle sub="Administrá las reservas de tu espacio">Reservas</SectionTitle>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all font-['Inter'] ${filter === item.id ? "bg-[#1C1917] text-white" : "bg-white border border-[#1C1917]/15 text-[#1C1917] hover:border-[#1C1917]/40"}`}
          >
            {item.label}
            {item.id === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-[#D4541B] text-white text-xs w-4 h-4 rounded-full inline-flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="??"
          title="No hay reservas para este filtro"
          description="Cuando entren nuevas reservas aparecerán acá."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <Card key={booking.id} className="p-4">
              <div className="flex items-start gap-3">
                <img
                  src={Array.isArray(booking?.space?.photos) && booking.space.photos.length > 0 ? booking.space.photos[0] : PLACEHOLDER_IMAGE}
                  alt={booking?.space?.title ?? "Espacio"}
                  className="w-16 h-16 object-cover rounded-xl"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-[#1C1917] text-sm font-['Inter'] line-clamp-1">{booking?.space?.title ?? "Espacio"}</span>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#1C1917]/50 font-['Inter'] mb-2">
                    <span>?? {formatDate(`${booking.date}T12:00:00`)}</span>
                    <span>?? {String(booking.start_time).slice(0, 5)} ? {String(booking.end_time).slice(0, 5)}</span>
                    <span>?? {booking.guest_count} pers.</span>
                    <span className="font-['JetBrains_Mono'] font-bold text-[#D4541B]">{formatUYU(booking.total_charged)}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="ghost" onClick={() => window.alert("Integrar chat/WhatsApp del guest en siguiente paso") }>
                      <MessageCircle size={14} /> Contactar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function Earnings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHostBookings() {
      setLoading(true);
      try {
        const data = await getMyBookings("host");
        if (!cancelled) setBookings(data);
      } catch {
        if (!cancelled) setBookings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHostBookings();

    return () => {
      cancelled = true;
    };
  }, []);

  const monthlyRows = useMemo(() => {
    const grouped = new Map();

    bookings.forEach((booking) => {
      const date = new Date(`${booking.date}T12:00:00`);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          month: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
          reservas: 0,
          gmv: 0,
          neto: 0,
          released: true,
        });
      }

      const row = grouped.get(key);
      row.reservas += 1;
      row.gmv += Number(booking.total_charged ?? 0);
      row.neto += Number(booking.host_payout ?? 0);
      if (booking.payment_status !== "released") row.released = false;
    });

    return Array.from(grouped.values())
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [bookings]);

  const total = monthlyRows.reduce((sum, row) => sum + row.neto, 0);
  const nextPending = monthlyRows.find((row) => !row.released);

  return (
    <PageContainer>
      <SectionTitle sub="Historial de pagos y próximas liquidaciones">Ganancias</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Ganancias acumuladas", value: formatUYU(total), sub: "Neto histórico (host_payout)" },
          { label: "Próxima liquidación", value: nextPending ? formatUYU(nextPending.neto) : formatUYU(0), sub: nextPending ? `${nextPending.month}` : "Sin pendientes" },
          { label: "Take rate Prende", value: "15%", sub: "Sobre cada transacción" },
        ].map(({ label, value, sub }) => (
          <Card key={label} className="p-5">
            <p className="text-xs text-[#1C1917]/40 font-['Inter'] mb-1">{label}</p>
            <p className="text-2xl font-bold text-[#D4541B] font-['JetBrains_Mono']">{value}</p>
            <p className="text-xs text-[#1C1917]/50 mt-1 font-['Inter']">{sub}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#1C1917]/10">
                {["Período", "Reservas", "GMV total", "Tu ganancia (host_payout)", "Estado"].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-xs font-bold text-[#1C1917]/40 uppercase tracking-wider font-['Inter']">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-sm text-[#1C1917]/50">Cargando...</td>
                </tr>
              ) : monthlyRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-sm text-[#1C1917]/50">Aún no hay movimientos.</td>
                </tr>
              ) : (
                monthlyRows.map((row) => (
                  <tr key={row.key} className="border-b border-[#1C1917]/8 last:border-0 hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-[#1C1917] font-['Inter']">{row.month}</td>
                    <td className="px-5 py-4 text-sm text-[#1C1917]/60 font-['JetBrains_Mono']">{row.reservas}</td>
                    <td className="px-5 py-4 text-sm text-[#1C1917]/60 font-['JetBrains_Mono']">{formatUYU(row.gmv)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-[#D4541B] font-['JetBrains_Mono']">{formatUYU(row.neto)}</td>
                    <td className="px-5 py-4">
                      <Badge variant={row.released ? "success" : "warning"}>
                        {row.released ? "? Liquidado" : "? Pendiente"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}

export default BookingManagement;
