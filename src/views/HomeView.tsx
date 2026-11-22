import { ArrowRight, Check, ImagePlus, MessageCircle, QrCode, Smartphone, Store } from 'lucide-react';
import { exampleStores } from '../data/examples';
import type { CatalogApp } from '../hooks/useCatalogApp';
import { formatMoney } from '../lib/format';
import { Button, Card } from '../components/ui';

const steps = [
  { icon: Store, title: 'Creamos tu tienda', text: 'Te damos tu enlace propio y cargamos tus primeros 20 productos.' },
  { icon: ImagePlus, title: 'Sube fotos desde el celular', text: 'Elige fotos de tu galería y publica productos en segundos.' },
  { icon: QrCode, title: 'Comparte tu QR', text: 'Imprímelo en el mostrador, mesas o redes. Tus clientes ven el catálogo al instante.' },
  { icon: MessageCircle, title: 'Recibe pedidos por WhatsApp', text: 'El cliente arma su carrito y te llega el pedido listo, con el total.' },
];

function PhoneMockup() {
  const items = [
    { name: 'Pan de jamón', price: '$12,00', color: 'from-amber-200 to-orange-300' },
    { name: 'Golfeados (6)', price: '$4,50', color: 'from-yellow-100 to-amber-200' },
    { name: 'Torta tres leches', price: '$18,00', color: 'from-rose-100 to-pink-200' },
    { name: 'Café con leche', price: '$1,50', color: 'from-stone-200 to-amber-100' },
  ];
  return (
    <div className="relative mx-auto w-[260px] rotate-[2deg] rounded-[2.4rem] border-[10px] border-ink-900 bg-white shadow-[var(--shadow-lift)] sm:w-[280px]" aria-hidden>
      <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-ink-900" />
      <div className="overflow-hidden rounded-[1.7rem]">
        <div className="bg-brand-600 px-4 pb-4 pt-9 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-xs font-bold">LD</span>
            <div>
              <p className="text-sm font-bold leading-tight">La Dulce Panadería</p>
              <p className="text-[10px] text-white/75">Abierto · Pedidos por WhatsApp</p>
            </div>
          </div>
          <div className="mt-3 h-7 rounded-lg bg-white/15" />
        </div>
        <div className="flex gap-1.5 px-3 py-2.5">
          {['Todos', 'Panes', 'Dulces'].map((chip, index) => (
            <span key={chip} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${index === 0 ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700'}`}>
              {chip}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          {items.map((item) => (
            <div key={item.name} className="overflow-hidden rounded-xl border border-ink-100">
              <div className={`h-16 bg-gradient-to-br ${item.color}`} />
              <div className="p-2">
                <p className="truncate text-[10px] font-semibold text-ink-900">{item.name}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold">{item.price}</span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-md bg-brand-600 text-[10px] text-white">+</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mx-3 mb-3 flex items-center justify-between rounded-xl bg-[#1fa855] px-3 py-2 text-[10px] font-semibold text-white">
          <span>3 productos · $18,00</span>
          <span>Pedir →</span>
        </div>
      </div>
    </div>
  );
}

export function HomeView({ app }: { app: CatalogApp }) {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100">
              <Smartphone className="h-3.5 w-3.5" /> Menú digital con QR
            </span>
            <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-6xl">
              Tu catálogo en el celular de tus clientes.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-500">
              Muestra tus productos con fotos y precios, comparte un código QR y recibe los pedidos directo en tu WhatsApp. Sin comisiones por venta.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => document.getElementById('ejemplos')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver tiendas de ejemplo <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => app.goToPanel('merchant')}>
                Entrar a mi tienda
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-700">
              {['Sin instalar apps', 'Fotos desde tu galería', 'Funciona con cualquier celular'].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-brand-600" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <PhoneMockup />
        </div>
      </section>

      <section id="ejemplos" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Ejemplos</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Mira cómo puede verse tu negocio</h2>
        <p className="mt-2 max-w-xl text-ink-500">Cada tienda tiene sus colores. Ábrelas, añade productos al carrito y mira cómo llega el pedido.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exampleStores.map(({ business, products, theme, summary, emoji }) => (
            <a
              key={business.id}
              href={`/ejemplo/${business.slug}`}
              className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink-200/70 bg-white shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="relative px-5 pb-12 pt-5 text-white" style={{ background: `linear-gradient(160deg, ${theme.primary}, ${theme.primaryDark})` }}>
                <span className="text-3xl" aria-hidden>{emoji}</span>
                <p className="mt-2 text-lg font-extrabold leading-tight" style={{ fontFamily: theme.headingFont }}>{business.name}</p>
                <p className="text-xs" style={{ color: theme.onPrimaryMuted }}>{theme.tagline}</p>
              </div>
              <div className="relative -mt-8 grid grid-cols-3 gap-2 px-4">
                {products.slice(0, 3).map((product) => (
                  <div key={product.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-ink-200/60">
                    <img
                      src={product.image}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                      onError={(event) => {
                        if (product.fallbackImage && event.currentTarget.src !== product.fallbackImage) event.currentTarget.src = product.fallbackImage;
                      }}
                    />
                    <p className="truncate px-1.5 py-1 text-[10px] font-bold text-ink-900">{formatMoney(product.price)}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-1 flex-col p-5 pt-3">
                <p className="text-sm text-ink-500">{summary}</p>
                <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-semibold" style={{ color: theme.primary }}>
                  Abrir ejemplo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <Card key={title} className="p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-ink-200">0{index + 1}</span>
              </div>
              <h3 className="mt-4 font-bold text-ink-900">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-ink-500">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-ink-900 p-8 text-white sm:p-12 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-200">Precio simple</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Todo listo para vender desde hoy.</h2>
            <p className="mt-3 max-w-lg text-ink-200">Incluye tu enlace propio, código QR, carga de tus primeros 20 productos y soporte.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
              <p className="text-3xl font-extrabold">$20</p>
              <p className="text-sm text-ink-200">Creación de la tienda</p>
            </div>
            <div className="rounded-2xl bg-brand-600 p-5">
              <p className="text-3xl font-extrabold">
                $5<span className="text-base font-semibold text-brand-100">/mes</span>
              </p>
              <p className="text-sm text-brand-100">Mantenimiento</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
