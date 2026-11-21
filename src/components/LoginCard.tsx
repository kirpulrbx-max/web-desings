import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Alert, Button, Card, Field, TextInput } from './ui';

export function LoginCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  submitLabel,
  defaultEmail = '',
  error,
  loading,
  onSubmit,
  footnote,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  submitLabel: string;
  defaultEmail?: string;
  error: string;
  loading: boolean;
  onSubmit: (email: string, password: string) => void | Promise<void>;
  footnote?: ReactNode;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <div className="mx-auto w-full max-w-md py-6 sm:py-12">
      <Card className="p-6 sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink-900">{title}</h2>
        <p className="mt-1.5 text-sm text-ink-500">{description}</p>
        <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <Field label="Correo">
            <TextInput type="email" required autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" />
          </Field>
          <Field label="Contraseña">
            <div className="relative">
              <TextInput
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="pr-11"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 hover:text-ink-700"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {submitLabel}
          </Button>
        </form>
        {footnote && <p className="mt-5 text-center text-xs leading-5 text-ink-500">{footnote}</p>}
      </Card>
    </div>
  );
}
