import { Minus, Plus, Search, ShoppingBag, Store, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Product } from '../data/mock';
import type { CatalogApp } from '../hooks/useCatalogApp';
import { formatMoney, getInitials } from '../lib/format';
import { Button, Card, EmptyState, ProductImage, Sheet, TextInput, cx } from '../components/ui';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}

function QuantityStepper({ value, onChange, size = 'md' }: { value: number; onChange: (delta: number) => void; size?: 'sm' | 'md' }) {
  const button = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className="inline-flex items-center rounded-xl bg-ink-100 p-0.5">
      <button className={cx(button, 'flex items-center justify-center rounded-[10px] text-ink-700 hover:bg-white')} onClick={() => onChange(-1)} aria-label="Quitar uno">
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-7 text-center text-sm font-bold tabular-nums text-ink-900">{value}</span>
      <button className={cx(button, 'flex items-center justify-center rounded-[10px] text-ink-700 hover:bg-white')} onClick={() => onChange(1)} aria-label="Añadir uno">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function ProductCard({ product, quantity, onAdd, onOpen }: { product: Product; quantity: number; onAdd: (delta: number) => void; onOpen: () => void }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white transition hover:shadow-[var(--shadow-soft)]">
      <button onClick={onOpen} className="relative block overflow-hidden" aria-label={`Ver ${product.name}`}>
        <ProductImage src={product.image} alt={product.name} className="aspect-square w-full transition duration-300 group-hover:scale-[1.03]" />
        {quantity > 0 && (
          <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-600 px-2 text-xs font-bold text-white shadow">{quantity}</span>
        )}
      </button>
      <div className="flex flex-1 flex-col p-3">
        <button onClick={onOpen} className="text-left">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900">{product.name}</h3>
          {product.description && <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{product.description}</p>}
        </button>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <p className="font-bold text-ink-900">{formatMoney(product.price)}</p>
          {quantity > 0 ? (
            <QuantityStepper value={quantity} onChange={onAdd} size="sm" />
          ) : (
            <button
              onClick={() => onAdd(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white transition hover:bg-brand-600"
              aria-label={`Añadir ${product.name} al pedido`}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function CartContents({ app }: { app: CatalogApp }) {
  const { cartItems, updateCart, cartTotal, checkoutUrl, clearCart } = app;
  if (cartItems.length === 0) {
    return <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Tu pedido está vacío" description="Toca + en un producto para añadirlo." />;
  }
  return (
    <div>
      <ul className="divide-y divide-ink-100">
        {cartItems.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3">
            <ProductImage src={item.image} alt={item.name} className="h-14 w-14 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>
              <p className="text-xs text-ink-500">{formatMoney(item.price)} c/u</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-bold tabular-nums">{formatMoney(item.price * item.quantity)}</span>
              <QuantityStepper value={item.quantity} onChange={(delta) => updateCart(item.id, delta)} size="sm" />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-ink-200 pt-4">
        <span className="text-sm text-ink-500">Total</span>
        <span className="text-xl font-extrabold tabular-nums text-ink-900">{formatMoney(cartTotal)}</span>
      </div>
      <p className="mt-1 text-xs text-ink-500">El pago y la entrega se coordinan con la tienda por WhatsApp.</p>
      <a
        href={checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#1fa855] text-base font-semibold text-white shadow-sm transition hover:bg-[#178a45]"
      >
        <WhatsAppIcon className="h-5 w-5" /> Enviar pedido por WhatsApp
      </a>
      <button onClick={clearCart} className="mx-auto mt-3 flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-rose-700">
        <Trash2 className="h-3.5 w-3.5" /> Vaciar pedido
      </button>
    </div>
  );
}

export function CatalogView({ app }: { app: CatalogApp }) {
  const { selectedBusiness, publicProducts, cart, updateCart, cartCount, cartTotal, storeLoading, requestedStoreUnavailable } = app;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [detail, setDetail] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const categories = useMemo(() => ['Todos', ...new Set(publicProducts.map((product) => product.category))], [publicProducts]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return publicProducts.filter(
      (product) =>
        (category === 'Todos' || product.category === category) &&
        (!needle || product.name.toLowerCase().includes(needle) || product.description.toLowerCase().includes(needle)),
    );
  }, [category, publicProducts, query]);

  if (storeLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" role="status" aria-label="Cargando catálogo">
        <div className="h-32 animate-pulse rounded-3xl bg-ink-100" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-ink-100" />
          ))}
        </div>
      </main>
    );
  }

  if (requestedStoreUnavailable || !selectedBusiness.id || selectedBusiness.status !== 'Activo') {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Store className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-ink-900">Tienda no disponible</h1>
        <p className="mt-2 text-ink-500">Este catálogo está inactivo temporalmente o el enlace no existe. Contacta directamente a la tienda.</p>
      </main>
    );
  }

  return (
    <main className="pb-28 lg:pb-12">
      <section className="bg-gradient-to-b from-brand-600 to-brand-700 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-extrabold text-brand-700 shadow-sm">
            {getInitials(selectedBusiness.name)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{selectedBusiness.name}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-brand-100">
              <WhatsAppIcon className="h-4 w-4" /> Haz tu pedido y te atendemos por WhatsApp
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sticky top-16 z-20 -mx-4 bg-ink-50/90 px-4 pb-3 pt-2 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:px-0 sm:bg-transparent sm:backdrop-blur-none">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <TextInput type="search" className="h-12 rounded-2xl border-0 pl-11 shadow-[var(--shadow-soft)]" placeholder={`Buscar en ${selectedBusiness.name}`} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          {categories.length > 2 && (
            <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {categories.map((option) => (
                <button
                  key={option}
                  onClick={() => setCategory(option)}
                  className={cx(
                    'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
                    category === option ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 shadow-sm ring-1 ring-ink-200/70 hover:bg-ink-50',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
          <div>
            {visible.length === 0 ? (
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title={publicProducts.length === 0 ? 'Pronto habrá productos aquí' : 'No encontramos productos'}
                description={publicProducts.length === 0 ? 'La tienda está preparando su catálogo.' : 'Prueba con otra palabra o categoría.'}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {visible.map((product) => (
                  <ProductCard key={product.id} product={product} quantity={cart[product.id] ?? 0} onAdd={(delta) => updateCart(product.id, delta)} onOpen={() => setDetail(product)} />
                ))}
              </div>
            )}
          </div>

          <aside className="hidden lg:block">
            <Card className="sticky top-24 p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink-900">Tu pedido</h2>
                {cartCount > 0 && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">{cartCount}</span>}
              </div>
              <CartContents app={app} />
            </Card>
          </aside>
        </div>
      </div>

      {cartCount > 0 && !cartOpen && !detail && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 px-4 pt-3 lg:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="animate-sheet flex h-14 w-full items-center justify-between rounded-2xl bg-ink-900 px-5 text-white shadow-[var(--shadow-lift)]"
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-500 px-2 text-xs font-bold">{cartCount}</span>
              Ver pedido
            </span>
            <span className="font-bold tabular-nums">{formatMoney(cartTotal)}</span>
          </button>
        </div>
      )}

      <Sheet open={cartOpen} onClose={() => setCartOpen(false)} eyebrow={selectedBusiness.name} title="Tu pedido">
        <CartContents app={app} />
      </Sheet>

      <Sheet open={Boolean(detail)} onClose={() => setDetail(null)} eyebrow={detail?.category} title={detail?.name ?? ''}>
        {detail && (
          <div>
            <ProductImage src={detail.image} alt={detail.name} className="aspect-[4/3] w-full rounded-2xl" />
            <p className="mt-4 text-2xl font-extrabold text-ink-900">{formatMoney(detail.price)}</p>
            {detail.description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-700">{detail.description}</p>}
            <div className="mt-6 flex items-center gap-3">
              {(cart[detail.id] ?? 0) > 0 && <QuantityStepper value={cart[detail.id] ?? 0} onChange={(delta) => updateCart(detail.id, delta)} />}
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  if (!cart[detail.id]) updateCart(detail.id, 1);
                  setDetail(null);
                }}
              >
                {(cart[detail.id] ?? 0) > 0 ? 'Listo' : `Añadir · ${formatMoney(detail.price)}`}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </main>
  );
}
