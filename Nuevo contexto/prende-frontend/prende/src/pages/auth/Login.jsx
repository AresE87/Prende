import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flame, Eye, EyeOff } from "lucide-react";
import { Button, Input, Divider } from "../../components/shared";
import { useApp } from "../../context/AppContext";

const loginSchema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const registerSchema = loginSchema.extend({
  name:            z.string().min(2, "Ingresá tu nombre"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const [mode, setMode]       = useState(searchParams.get("mode") === "register" ? "register" : "login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [asHost, setAsHost]     = useState(false);

  const schema = mode === "login" ? loginSchema : registerSchema;
  const { register, handleSubmit, formState: { errors }, reset } = useForm({ resolver: zodResolver(schema) });

  function switchMode() {
    setMode((m) => m === "login" ? "register" : "login");
    reset();
  }

  async function onSubmit(d) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    // Mock auth
    dispatch({
      type: "SET_USER",
      payload: {
        id: "u1",
        name: d.name ?? "Usuario Prende",
        email: d.email,
        avatar: "https://i.pravatar.cc/80?img=7",
        isHost: asHost,
      },
    });
    setLoading(false);
    navigate(asHost ? "/anfitrion/dashboard" : "/");
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Flame size={28} className="text-[#D4541B]" />
            <span className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">Prende</span>
          </div>
          <h1 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">
            {mode === "login" ? "Bienvenido de nuevo" : "Creá tu cuenta"}
          </h1>
          <p className="text-sm text-[#1C1917]/50 mt-1 font-['Inter']">
            {mode === "login" ? "Entrá para ver tus reservas" : "Empezá a disfrutar espacios únicos"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#1C1917]/10 shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === "register" && (
              <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                error={errors.name?.message}
                {...register("name")}
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="vos@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-9 text-[#1C1917]/40 hover:text-[#1C1917] transition-colors"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {mode === "register" && (
              <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            )}

            {mode === "register" && (
              <div className="bg-[#FAF7F2] rounded-xl p-4">
                <p className="text-sm font-semibold text-[#1C1917] mb-3 font-['Inter']">¿Para qué vas a usar Prende?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: false, icon: "🔥", label: "Reservar espacios", sub: "Quiero asarme" },
                    { val: true,  icon: "🏡", label: "Publicar mi espacio", sub: "Quiero ganar" },
                  ].map(({ val, icon, label, sub }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAsHost(val)}
                      className={`p-3 rounded-xl border text-left transition-all ${asHost === val ? "border-[#D4541B] bg-[#D4541B]/8" : "border-[#1C1917]/15 hover:border-[#1C1917]/30"}`}
                    >
                      <span className="text-xl block mb-1">{icon}</span>
                      <p className="text-xs font-bold text-[#1C1917] font-['Inter']">{label}</p>
                      <p className="text-[10px] text-[#1C1917]/40 font-['Inter']">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </Button>
          </form>

          <Divider className="my-4" />

          {/* Google OAuth placeholder */}
          <button className="w-full flex items-center justify-center gap-3 py-3 border border-[#1C1917]/20 rounded-xl text-sm font-medium text-[#1C1917] hover:bg-[#FAF7F2] transition-colors font-['Inter']">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            Continuar con Google
          </button>
        </div>

        <p className="text-center text-sm text-[#1C1917]/50 mt-5 font-['Inter']">
          {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}
          {" "}
          <button onClick={switchMode} className="text-[#D4541B] font-semibold hover:underline">
            {mode === "login" ? "Registrate" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}
