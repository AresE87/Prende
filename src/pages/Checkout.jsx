import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, CreditCard, Shield, CheckCircle2 } from "lucide-react";
import { Button, Input, Card, Divider, Badge } from "../components/shared";
import { formatUYU, formatDate } from "../lib/utils";

const schema = z.object({
  cardName: z.string().min(3, "Ingresá el nombre del titular"),
  cardNumber: z.string().regex(/^\d{4} \d{4} \d{4} \d{4}$/, "Número de tarjeta inválido"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Formato MM/AA"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV inválido"),
});

// Format card number as user types
function formatCardNumber(val) {
  return val.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
}

export default function Checkout() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedDate, startTime, endTime, persons, space, total, serviceFee } = location.state ?? {};

  const [step, setStep] = useState(1); // 1 = review, 2 = payment, 3 = done
  const [loading, setLoading] = useState(false);
  const [insurance, setInsurance] = useState(true);
  const insuranceFee = insurance ? 350 : 0;
  const finalTotal = (total ?? 0) + (serviceFee ?? 0) + insuranceFee;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  async function onSubmit() {
    setLoading(true);
    // Simular llamada a API
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    navigate(`/confirmacion/b-${Date.now()}`, {
      state: { space, selectedDate, startTime, endTime, persons, total: finalTotal },
    });
  }

  if (!space) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-[#1C1917]/60 font-['Inter']">No hay reserva en progreso.</p>
        <Button onClick={() => navigate("/")} className="mt-4">Ir al inicio</Button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[#1C1917]/60 hover:text-[#1C1917] mb-6 font-['Inter'] transition-colors">
          <ChevronLeft size={16} /> Volver al espacio
        </button>

        <h1 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-8">Confirmá tu reserva</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Form side */}
          <div className="lg:col-span-3 space-y-6">

            {/* Summary */}
            <Card className="p-5">
              <h2 className="font-bold text-[#1C1917] mb-4 font-['Plus_Jakarta_Sans']">Tu reserva</h2>
              <div className="flex gap-4">
                <img src={space.images[0]} alt="" className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#1C1917] text-sm font-['Plus_Jakarta_Sans']">{space.title}</p>
                  <p className="text-xs text-[#C2956B] mt-0.5 font-['Inter']">📍 {space.zona}</p>
                  <div className="mt-2 space-y-1 text-xs text-[#1C1917]/60 font-['Inter']">
                    <p>📅 {formatDate(selectedDate + "T00:00:00")}</p>
                    <p>🕐 {startTime}:00 → {endTime}:00 ({parseInt(endTime) - parseInt(startTime)} horas)</p>
                    <p>👥 {persons} personas</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Insurance */}
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-[#4A5E3A] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-[#1C1917] text-sm font-['Inter']">Seguro de daños</p>
                      <p className="text-xs text-[#1C1917]/50 mt-0.5 font-['Inter']">Cobertura ante daños accidentales. Recomendado.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#1C1917] font-['JetBrains_Mono']">{formatUYU(350)}</span>
                      <button
                        onClick={() => setInsurance(!insurance)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${insurance ? "bg-[#4A5E3A]" : "bg-[#1C1917]/20"}`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${insurance ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment */}
            <Card className="p-5">
              <h2 className="font-bold text-[#1C1917] mb-4 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                <CreditCard size={18} /> Método de pago
              </h2>
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Nombre en la tarjeta"
                  placeholder="Como aparece en la tarjeta"
                  error={errors.cardName?.message}
                  {...register("cardName")}
                />
                <Input
                  label="Número de tarjeta"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  error={errors.cardNumber?.message}
                  {...register("cardNumber", {
                    onChange: (e) => setValue("cardNumber", formatCardNumber(e.target.value)),
                  })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Vencimiento"
                    placeholder="MM/AA"
                    maxLength={5}
                    error={errors.expiry?.message}
                    {...register("expiry", {
                      onChange: (e) => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                        setValue("expiry", v);
                      },
                    })}
                  />
                  <Input
                    label="CVV"
                    placeholder="123"
                    maxLength={4}
                    error={errors.cvv?.message}
                    {...register("cvv")}
                  />
                </div>
              </form>

              <p className="text-xs text-[#1C1917]/40 mt-4 flex items-center gap-1.5 font-['Inter']">
                <Shield size={12} /> Pago procesado de forma segura. Tus datos están encriptados.
              </p>
            </Card>

            {/* Cancellation policy */}
            <div className="text-sm text-[#1C1917]/60 font-['Inter'] leading-relaxed">
              <p className="font-semibold text-[#1C1917] mb-1">Política de cancelación</p>
              <p>Cancelación gratuita hasta <strong>48 horas antes</strong> del inicio de la reserva. Pasado ese plazo, no se realizan reembolsos.</p>
            </div>
          </div>

          {/* Price summary */}
          <div className="lg:col-span-2">
            <Card className="p-5 sticky top-24">
              <h2 className="font-bold text-[#1C1917] mb-4 font-['Plus_Jakarta_Sans']">Resumen de pago</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-['Inter']">
                  <span className="text-[#1C1917]/60">{formatUYU(space.price)} × {parseInt(endTime) - parseInt(startTime)} horas</span>
                  <span className="font-medium font-['JetBrains_Mono']">{formatUYU(total)}</span>
                </div>
                <div className="flex justify-between text-sm font-['Inter']">
                  <span className="text-[#1C1917]/60">Cargo de servicio</span>
                  <span className="font-medium font-['JetBrains_Mono']">{formatUYU(serviceFee)}</span>
                </div>
                {insurance && (
                  <div className="flex justify-between text-sm font-['Inter']">
                    <span className="text-[#1C1917]/60">Seguro de daños</span>
                    <span className="font-medium font-['JetBrains_Mono']">{formatUYU(insuranceFee)}</span>
                  </div>
                )}
                <Divider />
                <div className="flex justify-between font-bold">
                  <span className="text-[#1C1917] font-['Inter']">Total</span>
                  <span className="text-[#D4541B] text-lg font-['JetBrains_Mono']">{formatUYU(finalTotal)}</span>
                </div>
              </div>

              <Button
                type="submit"
                form="checkout-form"
                fullWidth
                size="lg"
                className="mt-6"
                loading={loading}
              >
                {loading ? "Procesando..." : `Pagar ${formatUYU(finalTotal)}`}
              </Button>

              <p className="text-center text-xs text-[#1C1917]/40 mt-3 font-['Inter']">
                Al reservar aceptás los términos y condiciones de Prende.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
