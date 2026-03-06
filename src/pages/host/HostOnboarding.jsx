import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Upload,
  X,
} from "lucide-react";
import { AMENITIES, ZONAS, cn, formatUYU } from "../../lib/utils";
import { Badge, Button, Card, Input, Select, Textarea } from "../../components/shared";
import {
  ACCESS_TYPES,
  ADVANCE_NOTICE_OPTIONS,
  AMBIENCE_OPTIONS,
  AUDIENCE_TYPES,
  buildCommercialRead,
  BUSINESS_GOALS,
  CANCELLATION_OPTIONS,
  DAYPART_OPTIONS,
  DEFAULT_HIGHLIGHTS,
  DEFAULT_RULES,
  EVENT_TYPES,
  EXTRA_SERVICES,
  getOptionLabel,
  LOGISTICS_OPTIONS,
  SPACE_TYPES,
  STEP_ITEMS,
  TARGET_SEGMENTS,
  validateCurrentStep,
} from "./hostOnboardingConfig";

export default function HostOnboarding() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [ambiences, setAmbiences] = useState([]);
  const [dayparts, setDayparts] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [extraServices, setExtraServices] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [highlights, setHighlights] = useState(DEFAULT_HIGHLIGHTS);
  const [loading, setLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState("");

  const {
    register,
    control,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      spaceType: "",
      hook: "",
      description: "",
      businessGoal: "llenar_fechas_libres",
      zona: "",
      address: "",
      referencePoint: "",
      accessType: "",
      seatedCapacity: 12,
      maxPersons: 20,
      arrivalNotes: "",
      coverNote: "",
      price: 1200,
      weekendPrice: 1500,
      cleaningFee: 0,
      deposit: 0,
      minHours: 3,
      advanceNotice: "24h",
      cancellationPolicy: "moderada",
      targetSegment: "equilibrado",
    },
  });

  const watchedValues = useWatch({ control });
  const values = useMemo(() => watchedValues ?? {}, [watchedValues]);
  const currentStep = STEP_ITEMS[stepIndex];

  const completionMap = useMemo(() => ({
    identity: Boolean(values.title && values.spaceType && values.hook && values.description && values.businessGoal),
    location: Boolean(values.zona && values.address && values.referencePoint && values.accessType && Number(values.seatedCapacity) > 0 && Number(values.maxPersons) >= Number(values.seatedCapacity)),
    segmentation: eventTypes.length > 0 && audiences.length > 0 && ambiences.length > 0 && dayparts.length > 0,
    experience: amenities.length >= 3 && rules.filter(Boolean).length >= 2,
    media: photos.length >= 3 && highlights.filter(Boolean).length >= 2,
    pricing: Boolean(Number(values.price) > 0 && Number(values.weekendPrice) >= Number(values.price) && Number(values.minHours) > 0 && values.advanceNotice && values.cancellationPolicy && values.targetSegment),
    review: false,
  }), [values, eventTypes.length, audiences.length, ambiences.length, dayparts.length, amenities.length, rules, photos.length, highlights]);

  const completedSteps = useMemo(
    () => STEP_ITEMS.filter((item) => completionMap[item.id]).length,
    [completionMap],
  );

  const previewTags = [
    ...eventTypes.slice(0, 2),
    ...audiences.slice(0, 1),
    ...ambiences.slice(0, 2),
  ].slice(0, 5);

  async function handleNext() {
    setStepMessage("");
    const formValid = await trigger(currentStep.fields);
    const customValidation = validateCurrentStep(currentStep.id, {
      values,
      photos,
      eventTypes,
      audiences,
      ambiences,
      dayparts,
      amenities,
      rules,
      highlights,
    });

    if (!formValid || !customValidation.ok) {
      setStepMessage(customValidation.message ?? "Revisa los campos obligatorios de esta seccion.");
      return;
    }

    setStepIndex((prev) => Math.min(prev + 1, STEP_ITEMS.length - 1));
  }

  function handleBack() {
    setStepMessage("");
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }

  function toggleValue(setter, currentValues, value) {
    setter(currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value]);
  }

  function handlePhotoAdd(event) {
    const files = Array.from(event.target.files || []);
    const previews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...previews].slice(0, 10));
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateStringList(setter, index, value) {
    setter((prev) => prev.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  async function submitListing(formData) {
    const finalValidation = validateCurrentStep("review", {
      values: formData,
      photos,
      eventTypes,
      audiences,
      ambiences,
      dayparts,
      amenities,
      rules,
      highlights,
    });

    if (!finalValidation.ok) {
      setStepMessage(finalValidation.message);
      setStepIndex(Math.max(0, STEP_ITEMS.findIndex((item) => !completionMap[item.id])));
      return;
    }

    setLoading(true);
    const payload = {
      ...formData,
      photos,
      eventTypes,
      audiences,
      ambiences,
      dayparts,
      amenities,
      extraServices,
      logistics,
      rules: rules.filter(Boolean),
      highlights: highlights.filter(Boolean),
    };

    console.log("Publicar espacio:", payload);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLoading(false);
    navigate("/anfitrion/dashboard");
  }

  return (
    <div className="page-ambient min-h-screen pb-12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="brasa">Publicacion avanzada</Badge>
            <h1 className="mt-4 font-display text-5xl leading-none text-[#171616] sm:text-6xl">
              Diseña una ficha completa para vender mejor tu espacio.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#171616]/62 sm:text-base">
              Este menu te ayuda a describir, segmentar y posicionar tu propuesta para que el cliente entienda rapido por que reservarla.
            </p>
          </div>

          <Card className="px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/38">Progreso</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-[#171616]">{completedSteps}/{STEP_ITEMS.length - 1}</p>
            <p className="mt-1 text-sm text-[#171616]/58">Secciones listas para publicar</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,minmax(0,1fr)]">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/38">Menu de publicacion</p>
              <div className="mt-4 space-y-2">
                {STEP_ITEMS.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = index === stepIndex;
                  const isComplete = completionMap[item.id];

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setStepMessage("");
                        setStepIndex(index);
                      }}
                      className={cn(
                        "w-full rounded-[24px] border px-4 py-4 text-left transition",
                        isActive && "border-[#171616] bg-[#171616] text-white shadow-[0_22px_36px_-26px_rgba(23,22,22,0.78)]",
                        !isActive && isComplete && "border-[#d5632a]/18 bg-[#fff1e8] text-[#171616]",
                        !isActive && !isComplete && "border-[#171616]/8 bg-white/70 text-[#171616]",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-0.5 flex h-10 w-10 items-center justify-center rounded-full",
                          isActive && "bg-white/12 text-white",
                          !isActive && isComplete && "bg-[#d5632a] text-white",
                          !isActive && !isComplete && "bg-[#171616]/6 text-[#171616]/55",
                        )}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">{item.title}</p>
                            <span className={cn("text-[11px] uppercase tracking-[0.18em]", isComplete ? (isActive ? "text-white/68" : "text-[#d5632a]") : (isActive ? "text-white/44" : "text-[#171616]/34"))}>
                              {isComplete ? "OK" : `Paso ${index + 1}`}
                            </span>
                          </div>
                          <p className={cn("mt-1 text-sm leading-relaxed", isActive ? "text-white/72" : "text-[#171616]/54")}>
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/38">Preview rapido</p>
                  <h2 className="mt-2 text-xl font-semibold text-[#171616]">{values.title || "Tu espacio todavia no tiene titulo"}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#171616] text-[#f7f1e8] shadow-[0_16px_30px_-24px_rgba(23,22,22,0.8)]">
                  <Flame size={18} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {previewTags.length > 0 ? previewTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#171616]/8 bg-white/80 px-3 py-1.5 text-xs font-medium text-[#171616]/76">
                    {tag}
                  </span>
                )) : <span className="text-sm text-[#171616]/48">Selecciona publico, ocasiones y estilo para ver tu segmentacion.</span>}
              </div>

              <div className="mt-5 space-y-3 rounded-[26px] border border-[#171616]/8 bg-white/76 p-4">
                <PreviewRow label="Tipo" value={getOptionLabel(SPACE_TYPES, values.spaceType, "Sin definir")} />
                <PreviewRow label="Zona" value={values.zona || "Sin definir"} />
                <PreviewRow label="Capacidad" value={values.maxPersons ? `${values.maxPersons} personas max.` : "Sin definir"} />
                <PreviewRow label="Precio base" value={values.price ? formatUYU(values.price) : "Sin definir"} />
                <PreviewRow label="Fotos" value={`${photos.length} cargadas`} />
                <PreviewRow label="Amenities" value={`${amenities.length} activos`} />
              </div>

              <div className="mt-5 rounded-[24px] border border-[#d5632a]/14 bg-[#fff1e8] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#b35627]">Lectura comercial</p>
                <p className="mt-2 text-sm leading-relaxed text-[#5d3723]">
                  {buildCommercialRead(values, { eventTypes, audiences, ambiences, photos, highlights })}
                </p>
              </div>
            </Card>
          </aside>

          <form onSubmit={handleSubmit(submitListing)} className="space-y-6">
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/38">{currentStep.subtitle}</p>
                  <h2 className="mt-3 text-3xl font-semibold text-[#171616] sm:text-4xl">{currentStep.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#171616]/58 sm:text-base">{currentStep.description}</p>
                </div>
                <Badge variant={completionMap[currentStep.id] ? "success" : "default"}>
                  {completionMap[currentStep.id] ? "Completo" : `Paso ${stepIndex + 1}`}
                </Badge>
              </div>

              {stepMessage && (
                <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  {stepMessage}
                </div>
              )}

              <div className="mt-8">
                {currentStep.id === "identity" && (
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Input label="Titulo comercial" placeholder="Ej: Quincho premium con parrilla y sunset en Buceo" error={errors.title?.message} {...register("title", { required: "El titulo es obligatorio", minLength: { value: 12, message: "Usa al menos 12 caracteres" } })} />
                    </div>
                    <Select label="Tipo de espacio" options={SPACE_TYPES} error={errors.spaceType?.message} {...register("spaceType", { required: "Selecciona el tipo de espacio" })} />
                    <Select label="Objetivo comercial" options={BUSINESS_GOALS} error={errors.businessGoal?.message} {...register("businessGoal", { required: "Selecciona un objetivo" })} />
                    <div className="md:col-span-2">
                      <Input label="Promesa corta" placeholder="Ej: Ideal para asados chicos con vista abierta y check-in simple" error={errors.hook?.message} {...register("hook", { required: "Resume tu propuesta en una frase", minLength: { value: 20, message: "Escribe una promesa un poco mas completa" } })} />
                    </div>
                    <div className="md:col-span-2">
                      <Textarea label="Descripcion larga" rows={6} placeholder="Cuenta ambiente, instalaciones, diferencial, sensacion del lugar y por que resuelve bien cierto tipo de reunion." error={errors.description?.message} {...register("description", { required: "La descripcion es obligatoria", minLength: { value: 80, message: "Necesitas al menos 80 caracteres para describir bien el espacio" } })} />
                    </div>
                  </div>
                )}

                {currentStep.id === "location" && (
                  <div className="grid gap-5 md:grid-cols-2">
                    <Select label="Zona" options={ZONAS} error={errors.zona?.message} {...register("zona", { required: "Selecciona una zona" })} />
                    <Select label="Tipo de acceso" options={ACCESS_TYPES} error={errors.accessType?.message} {...register("accessType", { required: "Selecciona como se accede al espacio" })} />
                    <div className="md:col-span-2">
                      <Input label="Direccion" placeholder="Ej: Av. Brasil 2500" error={errors.address?.message} {...register("address", { required: "La direccion es obligatoria" })} />
                    </div>
                    <div className="md:col-span-2">
                      <Input label="Punto de referencia" placeholder="Ej: A 2 cuadras de la rambla, esquina con estacionamiento al frente" error={errors.referencePoint?.message} {...register("referencePoint", { required: "Ayuda al cliente con una referencia clara", minLength: { value: 12, message: "Agrega un poco mas de contexto" } })} />
                    </div>
                    <Input label="Capacidad sentados" type="number" min={1} error={errors.seatedCapacity?.message} {...register("seatedCapacity", { required: "Indica la capacidad sentados", valueAsNumber: true, min: { value: 1, message: "Debe ser mayor a 0" } })} />
                    <Input label="Capacidad maxima" type="number" min={1} error={errors.maxPersons?.message} {...register("maxPersons", { required: "Indica la capacidad maxima", valueAsNumber: true, min: { value: 1, message: "Debe ser mayor a 0" } })} />
                    <div className="md:col-span-2">
                      <Textarea label="Notas de llegada" rows={4} placeholder="Cuenta como es el ingreso, donde estacionar, si hay ascensor o algun detalle clave para llegar sin friccion." error={errors.arrivalNotes?.message} {...register("arrivalNotes", { required: "Agrega instrucciones de llegada", minLength: { value: 20, message: "Escribe una guia un poco mas completa" } })} />
                    </div>
                  </div>
                )}

                {currentStep.id === "segmentation" && (
                  <div className="space-y-6">
                    <ChipGroup title="Ocaciones ideales" subtitle="Selecciona los momentos donde este espacio convierte mejor." options={EVENT_TYPES} selected={eventTypes} onToggle={(value) => toggleValue(setEventTypes, eventTypes, value)} />
                    <ChipGroup title="Publico ideal" subtitle="Segmenta a quien quieres atraer para ajustar mejor tu propuesta." options={AUDIENCE_TYPES} selected={audiences} onToggle={(value) => toggleValue(setAudiences, audiences, value)} />
                    <ChipGroup title="Estilo o vibe" subtitle="Ayuda a posicionar el espacio mas alla de la foto." options={AMBIENCE_OPTIONS} selected={ambiences} onToggle={(value) => toggleValue(setAmbiences, ambiences, value)} />
                    <ChipGroup title="Momentos de uso" subtitle="Marca cuando brilla mejor tu producto." options={DAYPART_OPTIONS} selected={dayparts} onToggle={(value) => toggleValue(setDayparts, dayparts, value)} />
                  </div>
                )}

                {currentStep.id === "experience" && (
                  <div className="space-y-6">
                    <div>
                      <SectionEyebrow title="Amenities base" subtitle="Selecciona lo que ya forma parte de la propuesta." />
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {AMENITIES.map((amenity) => {
                          const active = amenities.includes(amenity.id);
                          return (
                            <button
                              key={amenity.id}
                              type="button"
                              onClick={() => toggleValue(setAmenities, amenities, amenity.id)}
                              className={cn(
                                "flex items-center gap-3 rounded-[22px] border px-4 py-4 text-left transition",
                                active ? "border-[#d5632a]/20 bg-[#fff1e8] text-[#171616]" : "border-[#171616]/8 bg-white/70 text-[#171616]",
                              )}
                            >
                              <span className="text-xl">{amenity.icon}</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{amenity.label}</p>
                              </div>
                              {active && <Check size={16} className="text-[#d5632a]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <ChipGroup title="Servicios extra" subtitle="Items que ayudan a subir ticket o cerrar mejor la reserva." options={EXTRA_SERVICES} selected={extraServices} onToggle={(value) => toggleValue(setExtraServices, extraServices, value)} />
                    <ChipGroup title="Logistica y operacion" subtitle="Aclara condiciones utiles para reducir preguntas repetidas." options={LOGISTICS_OPTIONS} selected={logistics} onToggle={(value) => toggleValue(setLogistics, logistics, value)} />

                    <div>
                      <SectionEyebrow title="Reglas del espacio" subtitle="Marca limites y expectativas antes de la reserva." />
                      <div className="mt-4 space-y-3">
                        {rules.map((rule, index) => (
                          <div key={`${rule}-${index}`} className="flex items-center gap-3">
                            <input
                              value={rule}
                              onChange={(event) => updateStringList(setRules, index, event.target.value)}
                              placeholder={`Regla ${index + 1}`}
                              className="w-full rounded-[22px] border border-[#171616]/10 bg-white/80 px-4 py-3.5 text-sm text-[#171616] shadow-[0_16px_40px_-34px_rgba(23,22,22,0.72)] outline-none transition duration-300 placeholder:text-[#171616]/35 focus:border-[#d5632a]/40 focus:bg-white focus:ring-4 focus:ring-[#d5632a]/10"
                            />
                            {rules.length > 1 && (
                              <button type="button" onClick={() => setRules((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#171616]/10 bg-white/80 text-[#171616]/55 transition hover:text-red-600" aria-label="Eliminar regla">
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => setRules((prev) => [...prev, ""])}>
                          Agregar regla
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep.id === "media" && (
                  <div className="space-y-6">
                    <div>
                      <SectionEyebrow title="Fotos del espacio" subtitle="Sube entre 3 y 10 fotos. La primera queda como portada." />
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {photos.map((photo, index) => (
                          <div key={`${photo.url}-${index}`} className="relative overflow-hidden rounded-[24px] border border-[#171616]/8 bg-white">
                            <img src={photo.url} alt="" className="h-36 w-full object-cover" />
                            {index === 0 && (
                              <span className="absolute left-3 top-3 rounded-full bg-[#171616] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                                Portada
                              </span>
                            )}
                            <button type="button" onClick={() => removePhoto(index)} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black" aria-label="Eliminar foto">
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        {photos.length < 10 && (
                          <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#171616]/14 bg-white/70 px-4 text-center transition hover:border-[#d5632a]/28 hover:bg-[#fff1e8]">
                            <Upload size={20} className="text-[#171616]/40" />
                            <p className="mt-3 text-sm font-medium text-[#171616]">Agregar fotos</p>
                            <p className="mt-1 text-xs leading-relaxed text-[#171616]/46">JPG, PNG o WEBP. Hasta 10 archivos.</p>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
                          </label>
                        )}
                      </div>
                    </div>

                    <Input label="Nota de portada" placeholder="Ej: Vista abierta, parrilla techada y check-in simple" error={errors.coverNote?.message} {...register("coverNote", { required: "Resume la portada en una linea", minLength: { value: 12, message: "Escribe una nota un poco mas descriptiva" } })} />

                    <div>
                      <SectionEyebrow title="Tres diferenciales" subtitle="Micro-copy util para vender mas rapido en listado y detalle." />
                      <div className="mt-4 grid gap-3">
                        {highlights.map((highlight, index) => (
                          <input
                            key={index}
                            value={highlight}
                            onChange={(event) => updateStringList(setHighlights, index, event.target.value)}
                            placeholder={`Diferencial ${index + 1}. Ej: Parrilla techada para dias de lluvia`}
                            className="w-full rounded-[22px] border border-[#171616]/10 bg-white/80 px-4 py-3.5 text-sm text-[#171616] shadow-[0_16px_40px_-34px_rgba(23,22,22,0.72)] outline-none transition duration-300 placeholder:text-[#171616]/35 focus:border-[#d5632a]/40 focus:bg-white focus:ring-4 focus:ring-[#d5632a]/10"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep.id === "pricing" && (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <MetricCard label="Precio base" value={values.price ? formatUYU(values.price) : formatUYU(0)} detail="Valor por hora" />
                      <MetricCard label="Fin de semana" value={values.weekendPrice ? formatUYU(values.weekendPrice) : formatUYU(0)} detail="Ticket sugerido" />
                      <MetricCard label="Host payout aprox." value={formatUYU((Number(values.price ?? 0) + Number(values.cleaningFee ?? 0)) * 0.85)} detail="Sobre una reserva base" />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <Input label="Precio base por hora" type="number" min={300} error={errors.price?.message} {...register("price", { required: "Define un precio base", valueAsNumber: true, min: { value: 300, message: "El minimo sugerido es $U 300" } })} />
                      <Input label="Precio sugerido fin de semana" type="number" min={300} error={errors.weekendPrice?.message} {...register("weekendPrice", { required: "Define un precio de fin de semana", valueAsNumber: true, min: { value: 300, message: "El minimo sugerido es $U 300" } })} />
                      <Input label="Fee de limpieza" type="number" min={0} error={errors.cleaningFee?.message} {...register("cleaningFee", { valueAsNumber: true, min: { value: 0, message: "No puede ser negativo" } })} />
                      <Input label="Deposito o garantia" type="number" min={0} error={errors.deposit?.message} {...register("deposit", { valueAsNumber: true, min: { value: 0, message: "No puede ser negativo" } })} />
                      <Input label="Minimo de horas" type="number" min={1} error={errors.minHours?.message} {...register("minHours", { required: "Define un minimo de horas", valueAsNumber: true, min: { value: 1, message: "Debe ser al menos 1 hora" } })} />
                      <Select label="Segmento de precio" options={TARGET_SEGMENTS} error={errors.targetSegment?.message} {...register("targetSegment", { required: "Selecciona un segmento" })} />
                      <Select label="Anticipacion minima" options={ADVANCE_NOTICE_OPTIONS} error={errors.advanceNotice?.message} {...register("advanceNotice", { required: "Selecciona una anticipacion minima" })} />
                      <Select label="Politica de cancelacion" options={CANCELLATION_OPTIONS} error={errors.cancellationPolicy?.message} {...register("cancellationPolicy", { required: "Selecciona una politica" })} />
                    </div>
                  </div>
                )}

                {currentStep.id === "review" && (
                  <div className="space-y-6">
                    <ReviewBlock title="Propuesta comercial" items={[["Titulo", values.title || "Pendiente"], ["Tipo", getOptionLabel(SPACE_TYPES, values.spaceType, "Pendiente")], ["Promesa", values.hook || "Pendiente"], ["Objetivo", getOptionLabel(BUSINESS_GOALS, values.businessGoal, "Pendiente")]]} />
                    <ReviewBlock title="Ubicacion y capacidad" items={[["Zona", values.zona || "Pendiente"], ["Direccion", values.address || "Pendiente"], ["Referencia", values.referencePoint || "Pendiente"], ["Capacidad", values.maxPersons ? `${values.maxPersons} personas max.` : "Pendiente"]]} />
                    <ReviewBlock title="Segmentacion" items={[["Ocaciones", eventTypes.length ? eventTypes.join(", ") : "Pendiente"], ["Publico ideal", audiences.length ? audiences.join(", ") : "Pendiente"], ["Ambiente", ambiences.length ? ambiences.join(", ") : "Pendiente"], ["Momentos", dayparts.length ? dayparts.join(", ") : "Pendiente"]]} />
                    <ReviewBlock title="Experiencia y operacion" items={[["Amenities", amenities.length ? `${amenities.length} seleccionados` : "Pendiente"], ["Extras", extraServices.length ? extraServices.join(", ") : "Sin extras"], ["Logistica", logistics.length ? logistics.join(", ") : "Sin marcadores"], ["Reglas", rules.filter(Boolean).length ? rules.filter(Boolean).join(" · ") : "Pendiente"]]} />
                    <ReviewBlock title="Contenido y precio" items={[["Fotos", photos.length ? `${photos.length} cargadas` : "Pendiente"], ["Diferenciales", highlights.filter(Boolean).length ? highlights.filter(Boolean).join(" · ") : "Pendiente"], ["Precio base", values.price ? formatUYU(values.price) : "Pendiente"], ["Fin de semana", values.weekendPrice ? formatUYU(values.weekendPrice) : "Pendiente"]]} />
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#171616]">{currentStep.title}</p>
                  <p className="text-sm text-[#171616]/56">{currentStep.subtitle}</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="button" variant="outline" onClick={handleBack} disabled={stepIndex === 0}>
                    <ChevronLeft size={16} />
                    Atras
                  </Button>

                  {stepIndex < STEP_ITEMS.length - 1 ? (
                    <Button type="button" onClick={handleNext}>
                      Siguiente
                      <ChevronRight size={16} />
                    </Button>
                  ) : (
                    <Button type="submit" loading={loading}>
                      {loading ? "Publicando..." : "Publicar espacio"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}

function SectionEyebrow({ title, subtitle }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/38">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#171616]/58">{subtitle}</p>
    </div>
  );
}

function ChipGroup({ title, subtitle, options, selected, onToggle }) {
  return (
    <div>
      <SectionEyebrow title={title} subtitle={subtitle} />
      <div className="mt-4 flex flex-wrap gap-3">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button key={option} type="button" onClick={() => onToggle(option)} className={cn("rounded-full border px-4 py-2.5 text-sm font-medium transition", active ? "border-[#d5632a]/18 bg-[#fff1e8] text-[#c85d2f]" : "border-[#171616]/10 bg-white/76 text-[#171616]/68")}>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[#171616]/46">{label}</span>
      <span className="text-right text-sm font-medium text-[#171616]">{value}</span>
    </div>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <div className="rounded-[24px] border border-[#171616]/8 bg-white/78 px-4 py-4 shadow-[0_14px_26px_-24px_rgba(73,52,40,0.26)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/38">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-[#171616]">{value}</p>
      <p className="mt-1 text-sm text-[#171616]/54">{detail}</p>
    </div>
  );
}

function ReviewBlock({ title, items }) {
  return (
    <div className="rounded-[28px] border border-[#171616]/8 bg-white/78 px-5 py-5 shadow-[0_18px_30px_-24px_rgba(73,52,40,0.2)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/38">{title}</p>
      <div className="mt-4 space-y-3">
        {items.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 border-b border-[#171616]/6 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <span className="text-sm text-[#171616]/48">{label}</span>
            <span className="text-sm font-medium leading-relaxed text-[#171616] sm:max-w-[68%] sm:text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
