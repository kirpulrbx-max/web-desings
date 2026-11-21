import { CheckCircle2, Loader2, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import type { BusinessStatus } from '../data/mock';
import type { Toast } from '../hooks/useCatalogApp';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
export { cx };

/* ------------------------------- Botones ------------------------------- */

type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'danger' | 'whatsapp';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-900',
  dark: 'bg-ink-900 text-white shadow-sm hover:bg-ink-700',
  secondary: 'border border-ink-200 bg-white text-ink-900 hover:bg-ink-50',
  ghost: 'text-ink-700 hover:bg-ink-100',
  danger: 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50',
  whatsapp: 'bg-[#1fa855] text-white shadow-sm hover:bg-[#178a45]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 rounded-xl px-3 text-xs',
  md: 'h-11 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-13 gap-2 rounded-2xl px-5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }) {
  return (
    <button
      className={cx(
        'inline-flex shrink-0 items-center justify-center font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-700 transition hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-brand-500', className)}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Formularios ---------------------------- */

const inputBase =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-ink-50';

export function Field({ label, hint, optional, children, className }: { label: string; hint?: ReactNode; optional?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-ink-700">
        <span>
          {label} {optional && <span className="font-normal text-ink-400">(opcional)</span>}
        </span>
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputBase, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputBase, 'resize-y', className)} {...props} />;
}

/* -------------------------------- Layout ------------------------------- */

export function Card({ className, children, id }: { className?: string; children: ReactNode; id?: string }) {
  return <section id={id} className={cx('rounded-[var(--radius-card)] border border-ink-200/70 bg-white shadow-[var(--shadow-soft)]', className)}>{children}</section>;
}

export function SectionTitle({ eyebrow, title, action, className }: { eyebrow?: string; title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>}
        <h2 className="mt-1 text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink-400 shadow-sm">{icon}</div>
      <p className="font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alert({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 break-words">{children}</div>
      {onClose && (
        <button className="rounded-md p-0.5 text-rose-600 hover:bg-rose-100" onClick={onClose} aria-label="Cerrar aviso">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* -------------------------------- Badges ------------------------------- */

const statusStyles: Record<BusinessStatus, string> = {
  Activo: 'bg-brand-50 text-brand-700 ring-brand-200',
  Suspendido: 'bg-amber-50 text-amber-800 ring-amber-200',
  Vencido: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export function StatusBadge({ status }: { status: BusinessStatus }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', statusStyles[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function StatCard({ label, value, icon, tone = 'ink' }: { label: string; value: string; icon: ReactNode; tone?: 'brand' | 'amber' | 'rose' | 'ink' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    ink: 'bg-ink-100 text-ink-700',
  };
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', tones[tone])}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-ink-500">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-ink-900">{value}</p>
      </div>
    </Card>
  );
}

/* ------------------------------ Modal/Sheet ---------------------------- */

export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && closeRef.current();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'animate-sheet flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-[var(--shadow-lift)] sm:rounded-3xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-ink-200 sm:hidden" aria-hidden />
        <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-3 sm:px-6 sm:pt-5">
          <div>
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>}
            <h2 className="mt-0.5 text-lg font-bold text-ink-900">{title}</h2>
          </div>
          <IconButton label="Cerrar" onClick={onClose} className="-mr-2">
            <X className="h-5 w-5" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
        {footer && <footer className="safe-bottom border-t border-ink-100 bg-white px-5 pt-3 sm:px-6 sm:pb-4">{footer}</footer>}
      </div>
    </div>
  );
}

/* -------------------------------- Toasts ------------------------------- */

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cx(
            'animate-sheet pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium shadow-[var(--shadow-lift)]',
            toast.tone === 'success' ? 'bg-ink-900 text-white' : 'bg-rose-600 text-white',
          )}
        >
          {toast.tone === 'success' ? <CheckCircle2 className="h-4 w-4 text-brand-200" /> : <XCircle className="h-4 w-4" />}
          {toast.text}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- Imágenes ------------------------------ */

export function ProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <div className={cx('flex items-center justify-center bg-gradient-to-br from-ink-100 to-ink-50 text-ink-400', className)} role="img" aria-label={alt}>
        <svg viewBox="0 0 24 24" className="h-1/3 max-h-10 w-1/3 max-w-10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <circle cx="9" cy="10" r="2" />
          <path d="m21 16-5-5-8 9" />
        </svg>
      </div>
    );
  }
  return <img src={src} alt={alt} className={cx('bg-ink-100 object-cover', className)} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
