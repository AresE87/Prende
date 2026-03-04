import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Upload, Shield } from "lucide-react";
import { Button, Input, Card, Avatar, Divider, PageContainer, SectionTitle, Badge } from "../../components/shared";
import { useApp } from "../../context/AppContext";

const schema = z.object({
  name:  z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  bio:   z.string().max(200, "Máximo 200 caracteres").optional(),
});

export default function Profile() {
  const { state, dispatch } = useApp();
  const user = state.user ?? { name: "Demo User", email: "demo@prende.uy", avatar: "", isHost: false };

  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [verifyOpen, setVerifyOpen]   = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, email: user.email, phone: "", bio: "" },
  });

  async function onSubmit(d) {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    dispatch({ type: "SET_USER", payload: { ...user, ...d } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <PageContainer className="max-w-2xl">
      <SectionTitle>Mi perfil</SectionTitle>

      {/* Avatar section */}
      <Card className="p-6 mb-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar src={user.avatar} name={user.name} size="xl" />
            <button className="absolute bottom-0 right-0 bg-[#D4541B] text-white rounded-full p-1.5 hover:bg-[#B8441A] transition-colors shadow-lg">
              <Camera size={14} />
            </button>
          </div>
          <div>
            <p className="font-bold text-[#1C1917] text-lg font-['Plus_Jakarta_Sans']">{user.name}</p>
            <p className="text-sm text-[#1C1917]/50 font-['Inter']">{user.email}</p>
            <div className="flex gap-2 mt-2">
              {user.isHost && <Badge variant="brasa">🔥 Anfitrión</Badge>}
              <Badge variant="oliva">✓ Email verificado</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card className="p-6 mb-5">
        <h2 className="font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-5">Datos personales</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre completo"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>
          <Input
            label="Teléfono (opcional)"
            type="tel"
            placeholder="+598 99 123 456"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <div>
            <label className="text-sm font-medium text-[#1C1917] block mb-1.5 font-['Inter']">Sobre vos (opcional)</label>
            <textarea
              placeholder="Contá brevemente quién sos..."
              maxLength={200}
              rows={3}
              className="w-full rounded-xl border border-[#1C1917]/20 px-4 py-3 text-sm text-[#1C1917] placeholder:text-[#1C1917]/40 outline-none focus:ring-2 focus:ring-[#D4541B] font-['Inter'] resize-none"
              {...register("bio")}
            />
          </div>
          <Button
            type="submit"
            loading={saving}
            disabled={!isDirty}
            variant={saved ? "success" : "primary"}
          >
            {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </Card>

      {/* Identity verification */}
      <Card className="p-6 mb-5">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-[#4A5E3A] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-[#1C1917] font-['Inter'] mb-1">Verificación de identidad</p>
            <p className="text-sm text-[#1C1917]/60 font-['Inter'] mb-3">
              Los perfiles verificados generan mayor confianza y pueden acceder a espacios premium.
            </p>
            <Badge variant="warning">⏳ No verificado</Badge>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVerifyOpen(true)}
              >
                <Upload size={14} /> Verificar identidad
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 border-red-100">
        <h3 className="font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-4">Zona peligrosa</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#1C1917] font-['Inter']">Eliminar cuenta</p>
            <p className="text-xs text-[#1C1917]/50 font-['Inter']">Esta acción es irreversible.</p>
          </div>
          <Button variant="danger" size="sm">Eliminar cuenta</Button>
        </div>
      </Card>

      {/* Verify modal */}
      {verifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setVerifyOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-[#1C1917] text-lg mb-2 font-['Plus_Jakarta_Sans']">Verificar identidad</h3>
            <p className="text-sm text-[#1C1917]/60 font-['Inter'] mb-5">
              Subí una foto de tu cédula de identidad uruguaya (frente y dorso).
            </p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {["Frente de CI", "Dorso de CI"].map((label) => (
                <label key={label} className="aspect-[4/3] rounded-xl border-2 border-dashed border-[#1C1917]/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#D4541B] hover:bg-[#D4541B]/5 transition-all">
                  <Upload size={20} className="text-[#1C1917]/30 mb-1" />
                  <span className="text-xs text-[#1C1917]/40 font-['Inter']">{label}</span>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setVerifyOpen(false)}>Cancelar</Button>
              <Button fullWidth onClick={() => setVerifyOpen(false)}>Enviar para revisión</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
