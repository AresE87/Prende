import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Upload, X, Plus, Check } from "lucide-react";
import { Button, Input, Textarea, Select, Card, StepIndicator } from "../../components/shared";
import { ZONAS, AMENITIES } from "../../lib/utils";

const STEPS = ["Datos básicos", "Fotos", "Amenities y reglas", "Precio"];

export default function HostOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [photos, setPhotos] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [rules, setRules] = useState([""]);
  const [loading, setLoading] = useState(false);

  // Step 0
  const { register: r0, handleSubmit: h0, formState: { errors: e0 } } = useForm();
  // Step 3
  const { register: r3, handleSubmit: h3, formState: { errors: e3 }, watch: w3 } = useForm({ defaultValues: { price: 1200, minHours: 2, maxPersons: 20 } });

  function nextStep(d) {
    setData((p) => ({ ...p, ...d }));
    setStep((s) => s + 1);
  }

  function handlePhotoAdd(e) {
    const files = Array.from(e.target.files || []);
    const previews = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPhotos((p) => [...p, ...previews].slice(0, 8));
  }

  function removePhoto(i) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  }

  function toggleAmenity(id) {
    setAmenities((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  async function finalSubmit(d) {
    setLoading(true);
    const payload = { ...data, photos, amenities, rules: rules.filter(Boolean), ...d };
    console.log("Publicar espacio:", payload);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    navigate("/anfitrion/dashboard");
  }

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-2">Publicá tu espacio</h1>
          <p className="text-[#1C1917]/60 font-['Inter'] text-sm mb-6">Solo te lleva 5 minutos</p>
          <StepIndicator steps={STEPS} current={step} />
          <p className="text-xs text-[#1C1917]/40 font-['Inter'] mt-3">{STEPS[step]}</p>
        </div>

        {/* STEP 0 — Datos básicos */}
        {step === 0 && (
          <Card className="p-6">
            <form onSubmit={h0(nextStep)} className="space-y-4">
              <Input
                label="Título del espacio"
                placeholder="Ej: Quincho con parrilla en Pocitos"
                error={e0.title?.message}
                {...r0("title", { required: "El título es obligatorio", minLength: { value: 10, message: "Mínimo 10 caracteres" } })}
              />
              <Textarea
                label="Descripción"
                placeholder="Contá qué tiene de especial tu espacio, el ambiente, las instalaciones..."
                rows={4}
                error={e0.description?.message}
                {...r0("description", { required: "La descripción es obligatoria", minLength: { value: 30, message: "Mínimo 30 caracteres" } })}
              />
              <Select
                label="Zona"
                options={ZONAS}
                error={e0.zona?.message}
                {...r0("zona", { required: "Seleccioná una zona" })}
              />
              <Input
                label="Capacidad máxima (personas)"
                type="number"
                min={1} max={200}
                error={e0.capacity?.message}
                {...r0("capacity", { required: "Requerido", min: { value: 1, message: "Mínimo 1 persona" }, valueAsNumber: true })}
              />
              <Input
                label="Dirección (solo se muestra a quienes reserven)"
                placeholder="Ej: Av. Brasil 2500, Pocitos"
                error={e0.address?.message}
                {...r0("address", { required: "La dirección es obligatoria" })}
              />
              <Button type="submit" fullWidth size="lg" className="mt-2">Siguiente →</Button>
            </form>
          </Card>
        )}

        {/* STEP 1 — Fotos */}
        {step === 1 && (
          <Card className="p-6">
            <p className="text-sm text-[#1C1917]/60 font-['Inter'] mb-5">
              Subí entre 3 y 8 fotos. La primera será la foto de portada. Fotos con buena luz convierten más.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#1C1917]/10">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 bg-[#D4541B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      PORTADA
                    </span>
                  )}
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {photos.length < 8 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-[#1C1917]/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#D4541B] hover:bg-[#D4541B]/5 transition-all">
                  <Plus size={24} className="text-[#1C1917]/30 mb-1" />
                  <span className="text-xs text-[#1C1917]/30 font-['Inter']">Agregar</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
                </label>
              )}
            </div>

            {photos.length === 0 && (
              <label className="block border-2 border-dashed border-[#1C1917]/20 rounded-2xl p-10 text-center cursor-pointer hover:border-[#D4541B] hover:bg-[#D4541B]/5 transition-all mb-5">
                <Upload size={32} className="mx-auto text-[#1C1917]/30 mb-2" />
                <p className="text-sm font-medium text-[#1C1917]/60 font-['Inter']">Hacé clic para subir fotos</p>
                <p className="text-xs text-[#1C1917]/30 mt-1">JPG, PNG o WEBP hasta 10MB cada una</p>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
              </label>
            )}

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setStep(0)}>← Atrás</Button>
              <Button
                fullWidth size="lg"
                disabled={photos.length < 1}
                onClick={() => setStep(2)}
              >
                Siguiente →
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2 — Amenities y reglas */}
        {step === 2 && (
          <Card className="p-6 space-y-6">
            <div>
              <p className="text-sm font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-3">¿Qué tiene tu espacio?</p>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => toggleAmenity(a.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all font-['Inter'] ${amenities.includes(a.id) ? "bg-[#D4541B]/10 border-[#D4541B] text-[#D4541B]" : "bg-white border-[#1C1917]/15 text-[#1C1917] hover:border-[#1C1917]/40"}`}
                  >
                    <span>{a.icon}</span>
                    <span className="flex-1">{a.label}</span>
                    {amenities.includes(a.id) && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-3">Reglas del espacio</p>
              <div className="space-y-2">
                {rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={rule}
                      onChange={(e) => {
                        const updated = [...rules];
                        updated[i] = e.target.value;
                        setRules(updated);
                      }}
                      placeholder={`Regla ${i + 1} (ej: No fumar)`}
                      className="flex-1 rounded-xl border border-[#1C1917]/20 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#D4541B] font-['Inter']"
                    />
                    {rules.length > 1 && (
                      <button onClick={() => setRules(rules.filter((_, idx) => idx !== i))}>
                        <X size={16} className="text-[#1C1917]/40 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setRules([...rules, ""])}
                  className="text-xs text-[#D4541B] font-semibold flex items-center gap-1 hover:underline font-['Inter']"
                >
                  <Plus size={14} /> Agregar regla
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setStep(1)}>← Atrás</Button>
              <Button
                fullWidth size="lg"
                disabled={amenities.length === 0}
                onClick={() => setStep(3)}
              >
                Siguiente →
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3 — Precio */}
        {step === 3 && (
          <Card className="p-6">
            <form onSubmit={h3(finalSubmit)} className="space-y-5">
              <div className="bg-[#FAF7F2] rounded-2xl p-5 text-center mb-2">
                <p className="text-xs text-[#1C1917]/40 uppercase tracking-wider font-['Inter'] mb-1">Tu precio por hora</p>
                <p className="text-4xl font-bold text-[#D4541B] font-['JetBrains_Mono']">
                  $U {(w3("price") ?? 1200).toLocaleString()}
                </p>
                <p className="text-xs text-[#1C1917]/40 font-['Inter'] mt-1">Vos cobrás 85% — Prende retiene 15%</p>
              </div>

              <Input
                label="Precio por hora ($U)"
                type="number"
                min={300}
                error={e3.price?.message}
                {...r3("price", {
                  required: "El precio es obligatorio",
                  min: { value: 300, message: "El mínimo es $U 300/hr" },
                  valueAsNumber: true,
                })}
              />
              <Input
                label="Mínimo de horas por reserva"
                type="number"
                min={1} max={12}
                error={e3.minHours?.message}
                {...r3("minHours", { required: "Requerido", valueAsNumber: true })}
              />
              <Input
                label="Capacidad máxima de personas"
                type="number"
                min={1}
                {...r3("maxPersons", { required: "Requerido", valueAsNumber: true })}
              />

              <div className="bg-[#1C1917]/5 rounded-xl p-4 text-sm font-['Inter']">
                <p className="font-semibold text-[#1C1917] mb-2">¿Cuánto podés ganar?</p>
                <div className="space-y-1 text-[#1C1917]/60">
                  <div className="flex justify-between">
                    <span>8 reservas × 3hs × {(w3("price") ?? 1200).toLocaleString()}</span>
                    <span className="font-['JetBrains_Mono'] text-[#1C1917]">${((w3("price") ?? 1200) * 3 * 8 * 0.85).toLocaleString()}/mes</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" fullWidth onClick={() => setStep(2)}>← Atrás</Button>
                <Button type="submit" fullWidth size="lg" loading={loading}>
                  {loading ? "Publicando..." : "🔥 Publicar espacio"}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
