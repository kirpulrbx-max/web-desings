import { Copy, Eye, EyeOff, MoreHorizontal, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '../data/mock';
import type { CatalogApp } from '../hooks/useCatalogApp';
import { formatMoney } from '../lib/format';
import { Button, Card, EmptyState, IconButton, ProductImage, SectionTitle, TextInput, cx } from './ui';

type Visibility = 'todos' | 'visibles' | 'ocultos';

function ProductActions({ product, app }: { product: Product; app: CatalogApp }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <IconButton label="Más acciones" onClick={() => setOpen((value) => !value)} className="h-9 w-9">
        <MoreHorizontal className="h-4 w-4" />
      </IconButton>
      {open && (
        <div className="animate-fade absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-2xl border border-ink-200 bg-white p-1 shadow-[var(--shadow-lift)]">
          <button
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-50"
            onClick={() => {
              setOpen(false);
              void app.duplicateProduct(product);
            }}
          >
            <Copy className="h-4 w-4" /> Duplicar
          </button>
          {confirming ? (
            <button
              className="flex w-full items-center gap-2 rounded-xl bg-rose-600 px-3 py-2.5 text-left text-sm font-semibold text-white"
              onClick={() => {
                setOpen(false);
                setConfirming(false);
                void app.removeProduct(product.id);
              }}
            >
              <Trash2 className="h-4 w-4" /> Sí, eliminar
            </button>
          ) : (
            <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50" onClick={() => setConfirming(true)}>
              <Trash2 className="h-4 w-4" /> Eliminar…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function VisibilitySwitch({ product, app }: { product: Product; app: CatalogApp }) {
  return (
    <button
      onClick={() => void app.toggleProductStatus(product.id)}
      aria-pressed={product.active}
      title={product.active ? 'Ocultar de la tienda' : 'Mostrar en la tienda'}
      className={cx(
        'inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold ring-1 ring-inset transition',
        product.active ? 'bg-brand-50 text-brand-700 ring-brand-200 hover:bg-brand-100' : 'bg-ink-50 text-ink-500 ring-ink-200 hover:bg-ink-100',
      )}
    >
      {product.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      {product.active ? 'Visible' : 'Oculto'}
    </button>
  );
}

export function ProductManager({ app, title = 'Tus productos' }: { app: CatalogApp; title?: string }) {
  const { businessProducts, businessCategories, openNewProduct, openEditProduct } = app;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [visibility, setVisibility] = useState<Visibility>('todos');

  useEffect(() => {
    if (category !== 'Todas' && !businessCategories.includes(category)) setCategory('Todas');
  }, [businessCategories, category]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return businessProducts.filter((product) => {
      if (category !== 'Todas' && product.category !== category) return false;
      if (visibility === 'visibles' && !product.active) return false;
      if (visibility === 'ocultos' && product.active) return false;
      return !needle || product.name.toLowerCase().includes(needle) || product.description.toLowerCase().includes(needle);
    });
  }, [businessProducts, category, query, visibility]);

  const hiddenCount = businessProducts.filter((product) => !product.active).length;

  return (
    <Card className="p-4 sm:p-6">
      <SectionTitle
        eyebrow={`${businessProducts.length} producto${businessProducts.length === 1 ? '' : 's'}${hiddenCount ? ` · ${hiddenCount} oculto${hiddenCount === 1 ? '' : 's'}` : ''}`}
        title={title}
        action={
          <Button onClick={() => openNewProduct(category !== 'Todas' ? category : businessCategories[0] ?? '')} className="max-sm:hidden">
            <Plus className="h-4 w-4" /> Añadir producto
          </Button>
        }
      />

      {businessProducts.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <TextInput className="pl-10" placeholder="Buscar producto" value={query} onChange={(event) => setQuery(event.target.value)} type="search" />
            </div>
            <div className="flex rounded-xl bg-ink-100 p-1 text-xs font-semibold">
              {(['todos', 'visibles', 'ocultos'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setVisibility(option)}
                  className={cx('flex-1 rounded-lg px-3 py-2 capitalize transition sm:flex-none', visibility === option ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {businessCategories.length > 1 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {['Todas', ...businessCategories].map((option) => (
                <button
                  key={option}
                  onClick={() => setCategory(option)}
                  className={cx(
                    'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition',
                    category === option ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-ink-700 ring-ink-200 hover:bg-ink-50',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5">
        {businessProducts.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="Tu catálogo está vacío"
            description="Añade tu primer producto con una foto de tu galería. Solo toma un minuto."
            action={
              <Button onClick={() => openNewProduct()}>
                <Plus className="h-4 w-4" /> Añadir primer producto
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Search className="h-6 w-6" />} title="Sin resultados" description="Prueba con otra búsqueda o filtro." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <li key={product.id} className={cx('group flex gap-3 rounded-2xl border border-ink-200/80 bg-white p-2.5 transition hover:border-ink-200 hover:shadow-[var(--shadow-soft)]', !product.active && 'bg-ink-50/70')}>
                <button className="shrink-0" onClick={() => openEditProduct(product)} aria-label={`Editar ${product.name}`}>
                  <ProductImage src={product.image} alt={product.name} className={cx('h-20 w-20 rounded-xl', !product.active && 'opacity-60 grayscale')} />
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <button className="min-w-0 text-left" onClick={() => openEditProduct(product)}>
                    <p className="truncate font-semibold text-ink-900">{product.name}</p>
                    <p className="truncate text-xs text-ink-500">{product.category}</p>
                  </button>
                  <div className="mt-auto flex items-center justify-between gap-1 pt-2">
                    <p className="text-sm font-bold text-ink-900">{formatMoney(product.price)}</p>
                    <div className="flex items-center gap-0.5">
                      <VisibilitySwitch product={product} app={app} />
                      <IconButton label="Editar" onClick={() => openEditProduct(product)} className="h-9 w-9">
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <ProductActions product={product} app={app} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Botón flotante en el celular: siempre a mano para añadir productos. */}
      {businessProducts.length > 0 && !app.editor.open && (
        <button
          onClick={() => openNewProduct(category !== 'Todas' ? category : businessCategories[0] ?? '')}
          className="fixed bottom-5 right-5 z-40 inline-flex h-14 items-center gap-2 rounded-2xl bg-brand-600 px-5 font-semibold text-white shadow-[var(--shadow-lift)] active:bg-brand-700 sm:hidden"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <Plus className="h-5 w-5" /> Producto
        </button>
      )}
    </Card>
  );
}
