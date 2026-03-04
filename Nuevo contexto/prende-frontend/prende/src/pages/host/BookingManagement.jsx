// ─── BOOKING MANAGEMENT ──────────────────────────────────────────────────────
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Check, X, Filter } from "lucide-react";
import { Button, Card, StatusBadge, Badge, PageContainer, SectionTitle, Modal, Avatar } from "../../components/shared";
import { formatUYU, formatDate } from "../../lib/utils";

const ALL_BOOKINGS = [
  { id: "b1", guest: "Camila R.", avatar: "https://i.pravatar.cc/40?img=21", date: "2025-03-15T14:00:00", endTime: "20:00", persons: 12, total: 7200, status: "confirmada", message: "Hola! Quiero reservar para un cumpleaños con familia." },
  { id: "b2", guest: "Rodrigo M.", avatar: "https://i.pravatar.cc/40?img=31", date: "2025-03-18T12:00:00", endTime: "18:00", persons: 8, total: 4800, status: "pendiente", message: "Somos 8 amigos para un asado clásico de domingo." },
  { id: "b3", guest: "Laura P.", avatar: "https://i.pravatar.cc/40?img=52", date: "2025-03-22T16:00:00", endTime: "22:00", persons: 15, total: 8400, status: "confirmada", message: "" },
  { id: "b4", guest: "Mateo S.", avatar: "https://i.pravatar.cc/40?img=15", date: "2025-02-28T14:00:00", endTime: "20:00", persons: 10, total: 7200, status: "completada", message: "" },
  { id: "b5", guest: "Sofía A.", avatar: "https://i.pravatar.cc/40?img=44", date: "2025-02-20T18:00:00", endTime: "22:00", persons: 6, total: 4800, status: "cancelada", message: "" },
];

export function BookingManagement() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filters = [
    { id: "all",       label: "Todas" },
    { id: "pendiente", label: "Pendientes" },
    { id: "confirmada",label: "Confirmadas" },
    { id: "completada",label: "Completadas" },
  ];

  const filtered = filter === "all" ? ALL_BOOKINGS : ALL_BOOKINGS.filter((b) => b.status === filter);

  return (
    <PageContainer>
      <SectionTitle sub="Administrá las reservas de tu espacio">Reservas</SectionTitle>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all font-['Inter'] ${filter === f.id ? "bg-[#1C1917] text-white" : "bg-white border border-[#1C1917]/15 text-[#1C1917] hover:border-[#1C1917]/40"}`}
          >
            {f.label}
            {f.id === "pendiente" && ALL_BOOKINGS.filter((b) => b.status === "pendiente").length > 0 && (
              <span className="ml-1.5 bg-[#D4541B] text-white text-xs w-4 h-4 rounded-full inline-flex items-center justify-center">
                {ALL_BOOKINGS.filter((b) => b.status === "pendiente").length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((b) => (
          <Card key={b.id} className="p-4">
            <div className="flex items-start gap-3">
              <Avatar src={b.avatar} name={b.guest} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-[#1C1917] text-sm font-['Inter']">{b.guest}</span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#1C1917]/50 font-['Inter'] mb-2">
                  <span>📅 {formatDate(b.date)}</span>
                  <span>🕐 {new Date(b.date).getHours()}:00 → {b.endTime}</span>
                  <span>👥 {b.persons} pers.</span>
                  <span className="font-['JetBrains_Mono'] font-bold text-[#D4541B]">{formatUYU(b.total)}</span>
                </div>
                {b.message && (
                  <p className="text-xs text-[#1C1917]/60 bg-[#FAF7F2] rounded-lg px-3 py-2 font-['Inter'] italic mb-2">
                    "{b.message}"
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {b.status === "pendiente" && (
                    <>
                      <Button size="sm" variant="success" onClick={() => setSelected({ ...b, action: "accept" })}>
                        <Check size={14} /> Aceptar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setSelected({ ...b, action: "reject" })}>
                        <X size={14} /> Rechazar
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost">
                    <MessageCircle size={14} /> Contactar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Confirm action modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.action === "accept" ? "Confirmar reserva" : "Rechazar reserva"}
      >
        {selected && (
          <div>
            <p className="text-[#1C1917]/70 font-['Inter'] mb-4">
              {selected.action === "accept"
                ? `¿Confirmás la reserva de ${selected.guest} para el ${formatDate(selected.date)}?`
                : `¿Rechazás la solicitud de ${selected.guest}? El usuario será notificado.`}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setSelected(null)}>Cancelar</Button>
              <Button
                fullWidth
                variant={selected.action === "accept" ? "success" : "danger"}
                onClick={() => { console.log(`${selected.action} booking ${selected.id}`); setSelected(null); }}
              >
                {selected.action === "accept" ? "Confirmar" : "Rechazar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

// ─── EARNINGS ────────────────────────────────────────────────────────────────
const EARNINGS_DATA = [
  { month: "Enero 2025",    reservas: 9,  gmv: 32400, neto: 27540, status: "liquidado" },
  { month: "Febrero 2025",  reservas: 11, gmv: 39600, neto: 33660, status: "liquidado" },
  { month: "Marzo 2025",    reservas: 8,  gmv: 28800, neto: 24480, status: "pendiente" },
];

export function Earnings() {
  const total = EARNINGS_DATA.reduce((s, d) => s + d.neto, 0);

  return (
    <PageContainer>
      <SectionTitle sub="Historial de pagos y próximas liquidaciones">Ganancias</SectionTitle>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Ganancias acumuladas", value: formatUYU(total), sub: "Neto después de comisión Prende" },
          { label: "Próxima liquidación", value: formatUYU(24480), sub: "Marzo 2025 · ~15 días" },
          { label: "Take rate Prende", value: "15%", sub: "Sobre cada transacción" },
        ].map(({ label, value, sub }) => (
          <Card key={label} className="p-5">
            <p className="text-xs text-[#1C1917]/40 font-['Inter'] mb-1">{label}</p>
            <p className="text-2xl font-bold text-[#D4541B] font-['JetBrains_Mono']">{value}</p>
            <p className="text-xs text-[#1C1917]/50 mt-1 font-['Inter']">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#1C1917]/10">
                {["Período", "Reservas", "GMV total", "Tu ganancia (85%)", "Estado"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-[#1C1917]/40 uppercase tracking-wider font-['Inter']">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EARNINGS_DATA.map((row, i) => (
                <tr key={i} className="border-b border-[#1C1917]/8 last:border-0 hover:bg-[#FAF7F2]/50 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-[#1C1917] font-['Inter']">{row.month}</td>
                  <td className="px-5 py-4 text-sm text-[#1C1917]/60 font-['JetBrains_Mono']">{row.reservas}</td>
                  <td className="px-5 py-4 text-sm text-[#1C1917]/60 font-['JetBrains_Mono']">{formatUYU(row.gmv)}</td>
                  <td className="px-5 py-4 text-sm font-bold text-[#D4541B] font-['JetBrains_Mono']">{formatUYU(row.neto)}</td>
                  <td className="px-5 py-4">
                    <Badge variant={row.status === "liquidado" ? "success" : "warning"}>
                      {row.status === "liquidado" ? "✓ Liquidado" : "⏳ Pendiente"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-[#1C1917]/40 mt-4 font-['Inter']">
        Las liquidaciones se realizan los días 15 de cada mes. El dinero se acredita en tu cuenta bancaria en 1–2 días hábiles.
      </p>
    </PageContainer>
  );
}

export default BookingManagement;
