import { createElement, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flame, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { Button, Input, Divider, Card, Badge } from "../../components/shared";
import { getProfile, signUpWithEmail, signInWithEmail, signInWithGoogle, supabaseConfigured } from "../../lib/supabase";
import { useApp } from "../../context/AppContext";
import { getSignedInHome } from "../../lib/navigation";

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Ingresa tu nombre"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state, authLoading } = useApp();

  const [mode, setMode] = useState(searchParams.get("mode") === "register" ? "register" : "login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [asHost, setAsHost] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const schema = mode === "login" ? loginSchema : registerSchema;
  const { register, handleSubmit, formState: { errors }, reset } = useForm({ resolver: zodResolver(schema) });
  const signedInRoute = useMemo(() => getSignedInHome(state.user), [state.user]);

  useEffect(() => {
    if (!authLoading && state.user && !confirmEmail) {
      navigate(signedInRoute, { replace: true });
    }
  }, [authLoading, confirmEmail, navigate, signedInRoute, state.user]);

  function switchMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setError(null);
    reset();
  }

  async function resolveSignedInRoute(userId, fallbackIsHost = false) {
    try {
      const profile = await getProfile(userId);
      return getSignedInHome({ isHost: Boolean(profile?.is_host ?? fallbackIsHost) });
    } catch {
      return getSignedInHome({ isHost: fallbackIsHost });
    }
  }

  async function onSubmit(data) {
    if (!supabaseConfigured) {
      setError("Supabase no configurado. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        const { session } = await signUpWithEmail(data.email, data.password, data.name);

        if (!session) {
          setConfirmEmail(true);
          setLoading(false);
          return;
        }

        navigate(asHost ? "/anfitrion/onboarding" : "/buscar", { replace: true });
      } else {
        const result = await signInWithEmail(data.email, data.password);
        const nextRoute = result.user
          ? await resolveSignedInRoute(result.user.id)
          : "/buscar";
        navigate(nextRoute, { replace: true });
      }
    } catch (err) {
      const msg = err.message || "Error al procesar la solicitud";
      if (msg.includes("Invalid login credentials")) {
        setError("Email o contraseña incorrectos");
      } else if (msg.includes("User already registered")) {
        setError("Ya existe una cuenta con ese email");
      } else if (msg.includes("Email not confirmed")) {
        setError("Confirma tu email antes de entrar. Revisa tu bandeja.");
      } else if (msg.includes("Password should be at least")) {
        setError("La contraseña debe tener al menos 6 caracteres");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!supabaseConfigured) {
      setError("Supabase no configurado");
      return;
    }
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "Error al conectar con Google");
    }
  }

  if (confirmEmail) {
    return (
      <div className="page-ambient flex min-h-screen items-center justify-center px-4 py-12">
        <div className="surface-card w-full max-w-xl rounded-[38px] px-8 py-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#171616_0%,#2f2b27_100%)] text-white shadow-[0_24px_44px_-28px_rgba(23,22,22,0.9)]">
            <ShieldCheck size={34} />
          </div>
          <Badge variant="oliva" className="mt-6">Revisa tu email</Badge>
          <h1 className="mt-5 font-display text-5xl leading-none text-[#171616]">Activa tu cuenta para continuar.</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#171616]/62">
            Te enviamos un link de confirmacion. Apenas lo abras, quedaras listo para reservar o publicar tu espacio.
          </p>
          <Button variant="outline" className="mt-8" onClick={() => { setConfirmEmail(false); setMode("login"); }}>
            Volver al login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-ambient min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.05fr)_520px]">
        <section className="section-shell flex rounded-[40px] px-6 py-8 sm:px-8 sm:py-10">
          <div className="my-auto max-w-2xl">
            <Badge variant="brasa">Tu cuenta Prende</Badge>
            <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-[#171616]/10 bg-white/75 px-4 py-3 shadow-[0_16px_28px_-24px_rgba(23,22,22,0.65)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171616] text-[#f7f1e8] shadow-[0_16px_24px_-18px_rgba(23,22,22,0.82)]">
                <Flame size={18} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Prende</p>
                <p className="text-sm font-semibold text-[#171616]">Reservas y pagos bien resueltos</p>
              </div>
            </div>
            <h1 className="mt-6 font-display text-5xl leading-none text-[#171616] sm:text-6xl lg:text-7xl">
              {mode === "login" ? "Entra para reservar, pagar y seguir tus reservas." : "Crea tu cuenta para reservar o publicar tu espacio."}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#171616]/62 sm:text-base">
              Desde tu cuenta puedes explorar espacios, revisar disponibilidad, confirmar pagos y acceder al estado de cada reserva en un solo lugar.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Feature icon={Sparkles} title="Explorar" description="Encuentra espacios con parrilla por zona." />
              <Feature icon={ShieldCheck} title="Reservas" description="Consulta pagos, fechas y estados desde tu cuenta." />
              <Feature icon={Building2} title="Anfitriones" description="Publica tu espacio y gestiona solicitudes." />
            </div>
          </div>
        </section>

        <Card className="rounded-[40px] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">{mode === "login" ? "Bienvenido" : "Nueva cuenta"}</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#171616]">
                {mode === "login" ? "Accede a tu cuenta" : "Empieza en Prende"}
              </h2>
            </div>
            <Badge variant={mode === "login" ? "default" : "brasa"}>{mode === "login" ? "Login" : "Registro"}</Badge>
          </div>

          {error && (
            <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {mode === "register" && (
              <Input label="Nombre completo" placeholder="Juan Perez" error={errors.name?.message} {...register("name")} />
            )}

            <Input label="Email" type="email" placeholder="tu@email.com" autoComplete="email" error={errors.email?.message} {...register("email")} />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                error={errors.password?.message}
                className="pr-12"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPass((value) => !value)}
                className="absolute right-4 top-[42px] text-[#171616]/42 transition hover:text-[#171616]"
                aria-label="Mostrar u ocultar contraseña"
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
              <div className="rounded-[28px] border border-[#171616]/8 bg-white/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Tipo de cuenta</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { value: false, icon: Sparkles, title: "Reservar espacios", description: "Quiero usar la plataforma como guest" },
                    { value: true, icon: Building2, title: "Publicar mi espacio", description: "Quiero vender disponibilidad" },
                  ].map((item) => {
                    const active = asHost === item.value;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => setAsHost(item.value)}
                        className={`rounded-[24px] border px-4 py-4 text-left transition ${active ? "border-[#d5632a]/25 bg-[#fff1e8]" : "border-[#171616]/8 bg-white/75 hover:border-[#171616]/18"}`}
                      >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${active ? "bg-[#d5632a] text-white" : "bg-[#171616] text-[#f7f1e8]"}`}>
                          <item.icon size={18} />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-[#171616]">{item.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-[#171616]/58">{item.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </form>

          <Divider className="my-6" />

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-[#171616]/10 bg-white/80 px-5 py-3.5 text-sm font-medium text-[#171616] shadow-[0_14px_28px_-24px_rgba(23,22,22,0.62)] transition hover:-translate-y-0.5 hover:bg-white"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            Continuar con Google
          </button>

          <p className="mt-6 text-center text-sm text-[#171616]/58">
            {mode === "login" ? "No tienes cuenta?" : "Ya tienes cuenta?"}{" "}
            <button type="button" onClick={switchMode} className="font-semibold text-[#d5632a] transition hover:text-[#b44a1d]">
              {mode === "login" ? "Registrate" : "Entrar"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }) {
  return (
    <div className="glass-shell rounded-[28px] px-4 py-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#171616] text-[#f7f1e8] shadow-[0_18px_30px_-22px_rgba(23,22,22,0.9)]">
        {createElement(icon, { size: 16 })}
      </div>
      <p className="mt-4 text-sm font-semibold text-[#171616]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#171616]/58">{description}</p>
    </div>
  );
}
