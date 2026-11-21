import { BarChart3, CheckCircle2, CreditCard, ExternalLink, Lock, Package, PauseCircle, PlayCircle, Plus, Search, Store, XCircle } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { LoginCard } from '../components/LoginCard';
import { ProductEditor } from '../components/ProductEditor';
import { ProductManager } from '../components/ProductManager';
import { QrCard } from '../components/QrCard';
import { Alert, Button, Card, EmptyState, Field, Sheet, StatCard, StatusBadge, TextInput, cx } from '../components/ui';
import type { BusinessStatus } from '../data/mock';
import type { CatalogApp, NewBusinessForm, PaymentForm } from '../hooks/useCatalogApp';
import { formatMoney, slugify, todayIso } from '../lib/format';
import { isSupabaseConfigured } from '../lib/supabase';

type Tab = 'datos' | 'productos' | 'pagos';

const emptyNewBusiness: NewBusinessForm = { name: '', slug: '', whatsapp: '', email: '', password: '' };
const newPaymentForm = (): PaymentForm => ({ amount: '5', date: todayIso(), period: '', notes: '', kind: 'Mensual' });

function NewBusinessSheet({ app, open, onClose }: { app: CatalogApp; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<NewBusinessForm>(emptyNewBusiness);
  const set = (field: keyof NewBusinessForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const valid = form.name.trim() && form.email.trim() && form.password.length >= 8;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await app.addBusiness(form)) {
      setForm(emptyNewBusiness);
      onClose();
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="Nueva tienda"
      title="Crear catálogo"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="new-business-form" loading={app.creatingBusiness} disabled={!valid}>Crear y activar</Button>
        </div>
      }
    >
      <form id="new-business-form" className="space-y-4" onSubmit={(event) => void submit(event)}>
        <Field label="Nombre del negocio">
          <TextInput required value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Ej. Arepera La Esquina" />
        </Field>
        <Field label="Enlace de la tienda" optional hint={`/tienda/${slugify(form.slug || form.name) || 'mi-negocio'}`}>
          <TextInput value={form.slug} onChange={(event) => set('slug', event.target.value)} placeholder="arepera-la-esquina" />
        </Field>
        <Field label="WhatsApp de pedidos" hint="Ej. 0414 123 4567 o +58 414 1234567">
          <TextInput inputMode="tel" value={form.whatsapp} onChange={(event) => set('whatsapp', event.target.value)} placeholder="0414 123 4567" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Correo del comerciante">
            <TextInput type="email" required value={form.email} onChange={(event) => set('email', event.target.value)} />
          </Field>
          <Field label="Contraseña" hint="Mínimo 8 caracteres">
            <TextInput type="text" autoComplete="new-password" minLength={8} required value={form.password} onChange={(event) => set('password', event.target.value)} />
          </Field>
        </div>
        {isSupabaseConfigured && <p className="rounded-xl bg-ink-50 px-3 py-2.5 text-xs leading-5 text-ink-500">Se crea automáticamente la cuenta del comerciante. Compártele su correo y contraseña.</p>}
        {app.dataError && <Alert>{app.dataError}</Alert>}
      </form>
    </Sheet>
  );
}

function PaymentSheet({ app, open, onClose }: { app: CatalogApp; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<PaymentForm>(newPaymentForm);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof PaymentForm>(field: K, value: PaymentForm[K]) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const ok = await app.savePayment(form);
    setSaving(false);
    if (ok) {
      setForm(newPaymentForm());
      onClose();
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow={app.selectedBusiness.name}
      title="Registrar pago"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="payment-form" loading={saving}>Guardar pago</Button>
        </div>
      }
    >
      <form id="payment-form" className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}>
        <Field label="Monto (USD)">
          <TextInput inputMode="decimal" required value={form.amount} onChange={(event) => set('amount', event.target.value)} />
        </Field>
        <Field label="Fecha">
          <TextInput type="date" required value={form.date} onChange={(event) => set('date', event.target.value)} />
        </Field>
        <Field label="Tipo">
          <div className="flex rounded-xl bg-ink-100 p-1 text-sm font-semibold">
            {(['Mensual', 'Inicial'] as const).map((kind) => (
              <button type="button" key={kind} onClick={() => set('kind', kind)} className={cx('flex-1 rounded-lg py-2', form.kind === kind ? 'bg-white shadow-sm' : 'text-ink-500')}>
                {kind}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Período" optional>
          <TextInput value={form.period} onChange={(event) => set('period', event.target.value)} placeholder="Ej. Noviembre 2026" />
        </Field>
        <Field label="Notas" optional className="sm:col-span-2">
          <TextInput value={form.notes} onChange={(event) => set('notes', event.target.value)} placeholder="Referencia, Pago Móvil, Zelle…" />
        </Field>
        {app.dataError && <div className="sm:col-span-2"><Alert>{app.dataError}</Alert></div>}
      </form>
    </Sheet>
  );
}

export function AdminView({ app }: { app: CatalogApp }) {
  const { adminLoggedIn, businesses, selectedBusiness, businessForm, setBusinessForm, payments } = app;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | BusinessStatus>('Todos');
  const [tab, setTab] = useState<Tab>('productos');
  const [newOpen, setNewOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return businesses.filter(
      (business) =>
        (statusFilter === 'Todos' || business.status === statusFilter) &&
        (!needle || business.name.toLowerCase().includes(needle) || business.slug.includes(needle) || business.ownerEmail.toLowerCase().includes(needle)),
    );
  }, [businesses, search, statusFilter]);

  const businessPayments = payments.filter((payment) => payment.businessId === selectedBusiness.id);
  const revenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  if (!adminLoggedIn) {
    return (
      <main className="px-4">
        <LoginCard
          icon={Lock}
          eyebrow="Acceso protegido"
          title="Administración"
          description="Gestiona todas las tiendas, sus productos y pagos."
          submitLabel="Entrar al panel"
          defaultEmail="admin@catalogofacil.ve"
          error={app.authError}
          loading={app.authLoading}
          onSubmit={app.loginAdmin}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Administración</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Tiendas</h1>
        </div>
        <Button onClick={() => { app.setDataError(''); setNewOpen(true); }}>
          <Plus className="h-4 w-4" /> Nueva tienda
        </Button>
      </div>

      {app.dataError && !newOpen && !paymentOpen && <Alert onClose={() => app.setDataError('')}>{app.dataError}</Alert>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Activas" value={String(app.adminMetrics.activeCount)} icon={<CheckCircle2 className="h-5 w-5" />} tone="brand" />
        <StatCard label="Suspendidas" value={String(app.adminMetrics.suspendedCount)} icon={<PauseCircle className="h-5 w-5" />} tone="amber" />
        <StatCard label="Vencidas" value={String(app.adminMetrics.expiredCount)} icon={<XCircle className="h-5 w-5" />} tone="rose" />
        <StatCard label="Ingresos registrados" value={formatMoney(revenue)} icon={<BarChart3 className="h-5 w-5" />} tone="ink" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr] [&>*]:min-w-0">
        <Card className="h-fit p-4 lg:sticky lg:top-24">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <TextInput type="search" className="pl-10" placeholder="Buscar tienda o correo" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
            {(['Todos', 'Activo', 'Suspendido', 'Vencido'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setStatusFilter(option)}
                className={cx('shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset', statusFilter === option ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-ink-700 ring-ink-200')}
              >
                {option}
              </button>
            ))}
          </div>
          <ul className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto">
            {filtered.map((business) => (
              <li key={business.id}>
                <button
                  onClick={() => app.selectBusinessForEdit(business)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition',
                    business.id === selectedBusiness.id ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-ink-50',
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-sm font-bold text-ink-700">
                    <Store className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-900">{business.name}</span>
                    <span className="block truncate text-xs text-ink-500">{business.productsCount} productos · vence {business.expiresAt || '—'}</span>
                  </span>
                  <StatusBadge status={business.status} />
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-2 py-6 text-center text-sm text-ink-500">No hay tiendas con ese filtro.</li>}
          </ul>
        </Card>

        {app.hasSelectedBusiness ? (
          <div className="min-w-0 space-y-4">
            <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-xl font-bold text-ink-900">{selectedBusiness.name}</h2>
                  <StatusBadge status={selectedBusiness.status} />
                </div>
                <p className="truncate text-sm text-ink-500">/tienda/{selectedBusiness.slug} · {selectedBusiness.ownerEmail || 'sin correo'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => window.open(app.publicUrl, '_blank', 'noopener,noreferrer')}>
                  <ExternalLink className="h-4 w-4" /> Ver tienda
                </Button>
                <Button variant={selectedBusiness.status === 'Activo' ? 'danger' : 'primary'} size="sm" onClick={() => void app.toggleBusinessStatus(selectedBusiness.id)}>
                  {selectedBusiness.status === 'Activo' ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                  {selectedBusiness.status === 'Activo' ? 'Suspender' : 'Activar'}
                </Button>
              </div>
            </Card>

            <div className="flex rounded-2xl bg-ink-100 p-1 text-sm font-semibold">
              {([
                ['productos', 'Productos', Package],
                ['datos', 'Datos y QR', Store],
                ['pagos', 'Pagos', CreditCard],
              ] as const).map(([id, label, Icon]) => (
                <button key={id} onClick={() => setTab(id)} className={cx('flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 transition', tab === id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}>
                  <Icon className="hidden h-4 w-4 sm:block" /> {label}
                </button>
              ))}
            </div>

            {tab === 'productos' && <ProductManager app={app} title={`Productos de ${selectedBusiness.name}`} />}

            {tab === 'datos' && (
              <div className="grid gap-4 xl:grid-cols-[1fr_320px] [&>*]:min-w-0">
                <Card className="space-y-4 p-5">
                  <Field label="Nombre del negocio">
                    <TextInput value={businessForm.name} onChange={(event) => setBusinessForm((current) => ({ ...current, name: event.target.value }))} />
                  </Field>
                  <Field label="Enlace de la tienda" hint="Si lo cambias, el QR impreso anterior dejará de funcionar.">
                    <TextInput value={businessForm.slug} onChange={(event) => setBusinessForm((current) => ({ ...current, slug: event.target.value }))} />
                  </Field>
                  <Field label="WhatsApp de pedidos">
                    <TextInput inputMode="tel" value={businessForm.whatsapp} onChange={(event) => setBusinessForm((current) => ({ ...current, whatsapp: event.target.value }))} placeholder="0414 123 4567" />
                  </Field>
                  {!isSupabaseConfigured && (
                    <>
                      <Field label="Correo del comerciante">
                        <TextInput type="email" value={businessForm.email} onChange={(event) => setBusinessForm((current) => ({ ...current, email: event.target.value }))} />
                      </Field>
                      <Field label="Nueva contraseña" optional hint="Déjala en blanco para mantener la actual.">
                        <TextInput type="password" minLength={8} value={businessForm.password} onChange={(event) => setBusinessForm((current) => ({ ...current, password: event.target.value }))} />
                      </Field>
                    </>
                  )}
                  <Button onClick={() => void app.saveBusinessDetails()} disabled={!businessForm.name.trim()}>Guardar cambios</Button>
                </Card>
                <QrCard url={app.publicUrl} storeName={selectedBusiness.name} slug={selectedBusiness.slug} onError={(message) => app.notify(message, 'error')} />
              </div>
            )}

            {tab === 'pagos' && (
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-ink-900">Historial de pagos</h3>
                  <Button size="sm" onClick={() => { app.setDataError(''); setPaymentOpen(true); }}>
                    <CreditCard className="h-4 w-4" /> Registrar pago
                  </Button>
                </div>
                <div className="mt-4">
                  {businessPayments.length === 0 ? (
                    <EmptyState icon={<CreditCard className="h-6 w-6" />} title="Sin pagos registrados" />
                  ) : (
                    <ul className="divide-y divide-ink-100">
                      {businessPayments.map((payment) => (
                        <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink-900">{payment.period}</p>
                            <p className="truncate text-xs text-ink-500">{payment.kind} · {payment.date}{payment.notes ? ` · ${payment.notes}` : ''}</p>
                          </div>
                          <p className="font-bold tabular-nums text-ink-900">{formatMoney(payment.amount)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<Store className="h-6 w-6" />}
            title="Aún no hay tiendas"
            description="Crea la primera tienda para empezar a cargar productos."
            action={<Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" /> Nueva tienda</Button>}
          />
        )}
      </div>

      <NewBusinessSheet app={app} open={newOpen} onClose={() => setNewOpen(false)} />
      <PaymentSheet app={app} open={paymentOpen} onClose={() => setPaymentOpen(false)} />
      <ProductEditor app={app} categories={app.businessCategories} />
    </main>
  );
}
