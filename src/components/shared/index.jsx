import { forwardRef } from "react";
import { X, Star, ChevronDown } from "lucide-react";
import { cn, starArray } from "../../lib/utils";

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className = "",
  ...props
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-55 focus:outline-none focus:ring-2 focus:ring-[#d5632a]/40 focus:ring-offset-2 focus:ring-offset-transparent";

  const variants = {
    primary: "border-[#d5632a] bg-[linear-gradient(135deg,#df7137_0%,#c95422_100%)] text-white shadow-[0_18px_35px_-24px_rgba(213,99,42,0.9)] hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-24px_rgba(213,99,42,0.75)] active:translate-y-0",
    secondary: "border-[#171616] bg-[#171616] text-[#f8f3ea] shadow-[0_18px_36px_-26px_rgba(23,22,22,0.82)] hover:-translate-y-0.5 hover:bg-[#24211f]",
    outline: "border-[#171616]/14 bg-white/75 text-[#171616] shadow-[0_10px_30px_-26px_rgba(23,22,22,0.55)] hover:-translate-y-0.5 hover:border-[#171616]/28 hover:bg-white",
    ghost: "border-transparent bg-transparent text-[#171616] hover:bg-[#171616]/6",
    danger: "border-red-600 bg-red-600 text-white shadow-[0_18px_35px_-24px_rgba(220,38,38,0.7)] hover:-translate-y-0.5 hover:bg-red-700",
    success: "border-[#5f6f52] bg-[#5f6f52] text-white shadow-[0_18px_35px_-24px_rgba(95,111,82,0.72)] hover:-translate-y-0.5 hover:bg-[#516145]",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-3",
    lg: "px-6 py-3.5 text-base",
    xl: "px-7 py-4 text-base",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export const Input = forwardRef(function Input({
  label,
  error,
  icon: Icon,
  className = "",
  ...props
}, ref) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#171616]/42">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#171616]/40">
            <Icon size={16} />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-[22px] border border-[#171616]/10 bg-white/80 px-4 py-3.5 text-sm text-[#171616] shadow-[0_16px_40px_-34px_rgba(23,22,22,0.72)] outline-none transition duration-300 placeholder:text-[#171616]/35 focus:border-[#d5632a]/40 focus:bg-white focus:ring-4 focus:ring-[#d5632a]/10",
            Icon && "pl-11",
            error && "border-red-300 focus:border-red-400 focus:ring-red-100",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, className = "", ...props }, ref) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#171616]/42">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-[22px] border border-[#171616]/10 bg-white/80 px-4 py-3.5 text-sm text-[#171616] shadow-[0_16px_40px_-34px_rgba(23,22,22,0.72)] outline-none transition duration-300 placeholder:text-[#171616]/35 focus:border-[#d5632a]/40 focus:bg-white focus:ring-4 focus:ring-[#d5632a]/10 resize-none",
          error && "border-red-300 focus:border-red-400 focus:ring-red-100",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select({
  label,
  error,
  options = [],
  placeholder = "Selecciona...",
  className = "",
  ...props
}, ref) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#171616]/42">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-[22px] border border-[#171616]/10 bg-white/80 px-4 py-3.5 pr-10 text-sm text-[#171616] shadow-[0_16px_40px_-34px_rgba(23,22,22,0.72)] outline-none transition duration-300 focus:border-[#d5632a]/40 focus:bg-white focus:ring-4 focus:ring-[#d5632a]/10",
            error && "border-red-300 focus:border-red-400 focus:ring-red-100",
            className,
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#171616]/38" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});

export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "border border-[#171616]/10 bg-white/70 text-[#171616]",
    brasa: "border border-[#d5632a]/15 bg-[#fff1e8] text-[#c24f20]",
    terracota: "border border-[#d8b38f]/30 bg-[#f6ece2] text-[#8c6248]",
    oliva: "border border-[#5f6f52]/18 bg-[#eff3eb] text-[#5f6f52]",
    success: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border border-amber-200 bg-amber-50 text-amber-700",
    danger: "border border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]", variants[variant], className)}>
      {children}
    </span>
  );
}

export function Avatar({ src, name = "", size = "md", className = "" }) {
  const sizes = {
    sm: "h-9 w-9 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-xl",
  };

  const initials = String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={cn("rounded-[24px] object-cover shadow-[0_16px_30px_-26px_rgba(23,22,22,0.7)]", sizes[size], className)} />;
  }

  return (
    <div className={cn("flex items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#171616_0%,#36302b_100%)] font-semibold text-[#f7f1e8] shadow-[0_16px_30px_-26px_rgba(23,22,22,0.7)]", sizes[size], className)}>
      {initials || "PR"}
    </div>
  );
}

export function Stars({ rating, size = 14, showNumber = false }) {
  const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="inline-flex items-center gap-0.5 text-[#d5632a]">
        {starArray(safeRating).map((filled, index) => (
          <Star key={index} size={size} className={filled ? "fill-current" : "text-[#171616]/16"} />
        ))}
      </div>
      {showNumber && <span className="font-mono text-xs font-semibold text-[#171616]">{safeRating.toFixed(1)}</span>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, className = "" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171616]/45 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className={cn("surface-card relative w-full max-w-xl rounded-[32px] p-6", className)} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-[#171616]/10 bg-white/80 p-2 text-[#171616]/70 transition hover:bg-white hover:text-[#171616]"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
        {title && <h3 className="pr-10 text-2xl font-bold text-[#171616]">{title}</h3>}
        <div className={cn(title && "mt-4")}>{children}</div>
      </div>
    </div>
  );
}

export function Card({ children, className = "", hover = false, ...props }) {
  return (
    <div
      className={cn(
        "surface-card rounded-[30px] p-0",
        hover && "transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-40px_rgba(23,22,22,0.34)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Divider({ className = "" }) {
  return <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-[#171616]/10 to-transparent", className)} />;
}

export function Skeleton({ className = "" }) {
  return <div className={cn("animate-pulse rounded-[22px] bg-[#171616]/7", className)} />;
}

export function StepIndicator({ steps, current }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <div key={step} className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold transition-all",
              done && "border-[#d5632a] bg-[#d5632a] text-white",
              active && "border-[#171616] bg-[#171616] text-white shadow-[0_14px_30px_-20px_rgba(23,22,22,0.9)]",
              !done && !active && "border-[#171616]/10 bg-white/70 text-[#171616]/45",
            )}>
              {done ? "OK" : index + 1}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#171616]/35">Paso {index + 1}</p>
              <p className="text-sm font-medium text-[#171616]">{step}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AmenityTag({ icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#171616]/10 bg-white/80 px-4 py-2 text-sm text-[#171616] shadow-[0_12px_28px_-26px_rgba(23,22,22,0.55)]">
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

export function EmptyState({ icon = "*", title, description, action }) {
  return (
    <div className="section-shell rounded-[36px] px-6 py-14 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#171616] text-2xl text-[#f7f1e8] shadow-[0_22px_40px_-28px_rgba(23,22,22,0.85)]">
        {icon}
      </div>
      <h3 className="mt-6 font-display text-4xl leading-none text-[#171616]">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#171616]/62">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function PageContainer({ children, className = "" }) {
  return (
    <main className={cn("page-ambient relative mx-auto max-w-7xl px-4 pb-18 pt-8 sm:px-6 lg:px-8", className)}>
      {children}
    </main>
  );
}

export function SectionTitle({ children, sub, className = "" }) {
  return (
    <div className={cn("mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#171616]/40">Prende</p>
        <h2 className="mt-2 font-display text-5xl leading-none text-[#171616] sm:text-6xl">{children}</h2>
      </div>
      {sub && <p className="max-w-xl text-sm leading-relaxed text-[#171616]/62 sm:text-base">{sub}</p>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    confirmada: { label: "Confirmada", variant: "success" },
    pendiente: { label: "Pendiente", variant: "warning" },
    completada: { label: "Completada", variant: "default" },
    cancelada: { label: "Cancelada", variant: "danger" },
    rechazada: { label: "Rechazada", variant: "danger" },
    pending: { label: "Pendiente", variant: "warning" },
    paid: { label: "Pagada", variant: "success" },
    confirmed: { label: "Confirmada", variant: "success" },
    completed: { label: "Completada", variant: "default" },
    cancelled: { label: "Cancelada", variant: "danger" },
    refunded: { label: "Reembolsada", variant: "warning" },
    released: { label: "Liquidada", variant: "oliva" },
    approved: { label: "Aprobado", variant: "success" },
    rejected: { label: "Rechazado", variant: "danger" },
    in_mediation: { label: "En disputa", variant: "warning" },
  };

  const resolved = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={resolved.variant}>{resolved.label}</Badge>;
}
