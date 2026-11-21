import { AlertTriangle, CalendarClock, ExternalLink, Eye, EyeOff, LayoutGrid, Store } from 'lucide-react';
import { LoginCard } from '../components/LoginCard';
import { ProductEditor } from '../components/ProductEditor';
import { ProductManager } from '../components/ProductManager';
import { QrCard } from '../components/QrCard';
import { Alert, Button, Card, StatCard, StatusBadge } from '../components/ui';
import type { CatalogApp } from '../hooks/useCatalogApp';
import { getInitials } from '../lib/format';

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
};

const daysUntil = (iso: string) => {
  if (!iso) return null;
  const diff = new Date(`${iso}T23:59:59`).getTime() - Date.now();
  return Number.isNaN(diff) ? null : Math.ceil(diff / 86_400_000);
};

export function MerchantView({ app }: { app: CatalogApp }) {
  const { merchantLoggedIn, selectedBusiness: store, businessProducts, businessCategories } = app;

  if (!merchantLoggedIn) {
    return (
      <main className="px-4">
        <LoginCard
          icon={Store}
          eyebrow="Panel del comerciante"
          title="Entra a tu tienda"
          description="Gestiona tus productos, fotos y tu código QR."
          submitLabel="Entrar"
          error={app.merchantAuthError}
          loading={app.authLoading}
          onSubmit={app.loginMerchant}
          footnote="¿No tienes contraseña? Pídela al administrador de Catálogo Fácil."
        />
      </main>
    );
  }

  const visible = businessProducts.filter((product) => product.active).length;
  const remaining = daysUntil(store.expiresAt);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-lg font-extrabold text-white shadow-sm">{getInitials(store.name)}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Mi tienda</p>
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">{store.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={store.status} />
          <Button variant="secondary" size="sm" onClick={() => window.open(app.publicUrl, '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="h-4 w-4" /> Ver mi tienda
          </Button>
        </div>
      </div>

      {store.status !== 'Activo' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Tu catálogo no está visible para los clientes ({store.status.toLowerCase()}). Puedes seguir editando productos; contacta al administrador para reactivarlo.</p>
        </div>
      )}
      {app.dataError && <Alert onClose={() => app.setDataError('')}>{app.dataError}</Alert>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Visibles" value={String(visible)} icon={<Eye className="h-5 w-5" />} tone="brand" />
        <StatCard label="Ocultos" value={String(businessProducts.length - visible)} icon={<EyeOff className="h-5 w-5" />} tone="ink" />
        <StatCard label="Categorías" value={String(businessCategories.length)} icon={<LayoutGrid className="h-5 w-5" />} tone="ink" />
        <StatCard
          label="Días de servicio"
          value={remaining === null ? '—' : String(Math.max(0, remaining))}
          icon={<CalendarClock className="h-5 w-5" />}
          tone={remaining !== null && remaining <= 5 ? 'amber' : 'ink'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] [&>*]:min-w-0">
        <ProductManager app={app} />
        <div className="space-y-6">
          <QrCard url={app.publicUrl} storeName={store.name} slug={store.slug} onError={(message) => app.notify(message, 'error')} />
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Suscripción</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Estado</dt>
                <dd><StatusBadge status={store.status} /></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Próximo vencimiento</dt>
                <dd className="font-semibold text-ink-900">{formatDate(store.expiresAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">WhatsApp de pedidos</dt>
                <dd className="font-semibold text-ink-900">{store.whatsapp || '—'}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <ProductEditor app={app} categories={businessCategories} />
    </main>
  );
}
