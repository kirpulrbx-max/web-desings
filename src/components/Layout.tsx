import { LogOut, Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { getExampleSlugFromPath } from '../data/examples';
import { getStoreSlugFromPath, type CatalogApp, type Panel } from '../hooks/useCatalogApp';
import { getSupabaseStatusMessage, isSupabaseConfigured } from '../lib/supabase';
import { Button, IconButton, cx } from './ui';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <ShoppingBag className="h-[18px] w-[18px]" />
      </span>
      {!compact && <span className="whitespace-nowrap text-base font-extrabold tracking-tight text-ink-900">Catálogo Fácil</span>}
    </span>
  );
}

const navItems: Array<[Panel | 'ejemplos', string]> = [
  ['home', 'Inicio'],
  ['ejemplos', 'Ejemplos'],
  ['merchant', 'Mi tienda'],
  ['admin', 'Administración'],
];

export function Header({ app }: { app: CatalogApp }) {
  const [open, setOpen] = useState(false);
  const loggedIn = app.adminLoggedIn || app.merchantLoggedIn;
  // En la tienda pública los clientes solo ven una barra mínima, sin enlaces de administración.
  const storefront = app.activePanel === 'catalog' && Boolean(getStoreSlugFromPath() || getExampleSlugFromPath()) && !loggedIn;
  const go = (panel: Panel | 'ejemplos') => {
    setOpen(false);
    if (panel === 'ejemplos') {
      app.goToPanel('home');
      window.setTimeout(() => document.getElementById('ejemplos')?.scrollIntoView({ behavior: 'smooth' }), 60);
      return;
    }
    app.goToPanel(panel);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={() => go('home')} aria-label="Ir al inicio">
          <Logo />
        </button>

        {storefront ? (
          <span className="text-xs font-medium text-ink-400">Catálogo digital</span>
        ) : (
        <>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(([panel, label]) => (
            <button
              key={panel}
              onClick={() => go(panel)}
              className={cx(
                'whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition',
                app.activePanel === panel ? 'bg-ink-100 text-ink-900' : 'text-ink-500 hover:text-ink-900',
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isSupabaseConfigured && import.meta.env.DEV && (
            <span className="hidden rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200 xl:inline-flex" title={getSupabaseStatusMessage()}>
              Modo demo
            </span>
          )}
          {loggedIn ? (
            <Button variant="secondary" size="sm" onClick={() => void app.logout()}>
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Salir</span>
            </Button>
          ) : (
            <Button size="sm" className="max-sm:hidden" onClick={() => go('merchant')}>
              Entrar a mi tienda
            </Button>
          )}
          <IconButton label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </IconButton>
        </div>
        </>
        )}
      </div>

      {open && !storefront && (
        <nav className="animate-fade border-t border-ink-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map(([panel, label]) => (
              <button
                key={panel}
                onClick={() => go(panel)}
                className={cx('rounded-xl px-3 py-3 text-left text-sm font-medium', app.activePanel === panel ? 'bg-ink-100 text-ink-900' : 'text-ink-700')}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink-200/70 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Logo />
        <p>Catálogos digitales para comercios de Venezuela · Pedidos por WhatsApp</p>
      </div>
    </footer>
  );
}
