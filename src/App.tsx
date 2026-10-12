import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  ImageIcon,
  Lock,
  Package,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Wallet,
  Zap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { businesses as businessSeed, initialProducts, payments as paymentSeed, type Business, type Product } from './data/mock';
import { getSupabaseStatusMessage, isSupabaseConfigured, supabase } from './lib/supabase';

type Panel = 'home' | 'admin' | 'merchant' | 'catalog';
type BusinessStatus = 'Activo' | 'Suspendido' | 'Vencido';

type NewBusinessForm = {
  name: string;
  slug: string;
  whatsapp: string;
  email: string;
  password: string;
};

const categories = ['Todos', 'Panadería', 'Postres', 'Abarrotes', 'Hogar', 'Bebés'];
const businessesStorageKey = 'catalogo-facil-businesses';

const loadBusinesses = (): Business[] => {
  if (typeof window === 'undefined') return businessSeed;
  try {
    const savedBusinesses = window.localStorage.getItem(businessesStorageKey);
    return savedBusinesses ? JSON.parse(savedBusinesses) as Business[] : businessSeed;
  } catch {
    return businessSeed;
  }
};

const statusStyles: Record<BusinessStatus, string> = {
  Activo: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  Suspendido: 'bg-amber-100 text-amber-800 border border-amber-200',
  Vencido: 'bg-rose-100 text-rose-800 border border-rose-200',
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const buildWhatsAppMessage = (items: Array<{ name: string; quantity: number; price: number }>) => {
  const lines = items.map((item) => `* ${item.quantity} x ${item.name} — ${formatMoney(item.quantity * item.price)}`);
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  return `Hola, quiero realizar este pedido:\n\n${lines.join('\n')}\n\nTotal: ${formatMoney(subtotal)}\n\n¿Podrían confirmarme la disponibilidad?`;
};

const hashMerchantPassword = async (password: string) => {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export default function App() {
  const [activePanel, setActivePanel] = useState<Panel>('home');
  const [businesses, setBusinesses] = useState<Business[]>(loadBusinesses);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [payments, setPayments] = useState(paymentSeed);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | BusinessStatus>('Todos');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(businessSeed[0].id);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: 'admin@catalogofacil.ve', password: '' });
  const [authError, setAuthError] = useState('');
  const [merchantLoggedIn, setMerchantLoggedIn] = useState(false);
  const [merchantForm, setMerchantForm] = useState({ email: '', password: '' });
  const [merchantAuthError, setMerchantAuthError] = useState('');
  const [catalogFilter, setCatalogFilter] = useState('Todos');
  const [qrSvgElement, setQrSvgElement] = useState<SVGSVGElement | null>(null);
  const [newBusiness, setNewBusiness] = useState<NewBusinessForm>({
    name: '',
    slug: '',
    whatsapp: '',
    email: '',
    password: '',
  });

  const [businessForm, setBusinessForm] = useState({
    name: businessSeed[0].name,
    slug: businessSeed[0].slug,
    whatsapp: businessSeed[0].whatsapp,
    email: businessSeed[0].ownerEmail,
    password: '',
  });

  const selectedBusiness =
    businesses.find((business) => business.id === selectedBusinessId) ?? businesses[0];

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const matchesSearch =
        business.name.toLowerCase().includes(search.toLowerCase()) ||
        business.slug.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || business.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [businesses, search, statusFilter]);

  const publicProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesBusiness = product.businessId === selectedBusiness.id;
      const matchesCategory = catalogFilter === 'Todos' || product.category === catalogFilter;
      return matchesBusiness && product.active && matchesCategory;
    });
  }, [catalogFilter, products, selectedBusiness.id]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const item = products.find((product) => product.id === productId);
        if (!item || quantity <= 0) return null;
        return { ...item, quantity };
      })
      .filter(Boolean) as Array<Product & { quantity: number }>;
  }, [cart, products]);

  const totalCart = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const adminMetrics = useMemo(() => {
    const activeCount = businesses.filter((business) => business.status === 'Activo').length;
    const suspendedCount = businesses.filter((business) => business.status === 'Suspendido').length;
    const expiredCount = businesses.filter((business) => business.status === 'Vencido').length;
    const totalProducts = products.length;
    return { activeCount, suspendedCount, expiredCount, totalProducts };
  }, [businesses, products]);

  const merchantSummary = useMemo(() => {
    const businessProducts = products.filter((product) => product.businessId === selectedBusiness.id);
    const enabledProducts = businessProducts.filter((product) => product.active).length;
    return {
      enabledProducts,
      pendingProducts: businessProducts.filter((product) => !product.active).length,
      revenue: businessProducts.reduce((sum, product) => sum + product.price, 0),
    };
  }, [products, selectedBusiness.id]);

  useEffect(() => {
    const requestedSlug = decodeURIComponent(window.location.pathname.match(/^\/tienda\/([^/]+)\/?$/)?.[1] ?? '');
    if (!requestedSlug) return;
    const matchingBusiness = businesses.find((business) => business.slug === requestedSlug);
    if (matchingBusiness) {
      setSelectedBusinessId(matchingBusiness.id);
      setActivePanel('catalog');
    }
  }, [businesses]);

  const updateCart = (productId: string, delta: number) => {
    setCart((current) => {
      const nextValue = Math.max((current[productId] ?? 0) + delta, 0);
      const result = { ...current };
      if (nextValue === 0) delete result[productId];
      else result[productId] = nextValue;
      return result;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => {
      const result = { ...current };
      delete result[productId];
      return result;
    });
  };

  const addBusiness = () => {
    if (!newBusiness.name.trim() || !newBusiness.email.trim() || newBusiness.password.length < 8) return;
    const slug = newBusiness.slug || newBusiness.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    void hashMerchantPassword(newBusiness.password).then((merchantPasswordHash) => {
      const createdBusiness: Business = {
      id: `biz-${Date.now()}`,
      name: newBusiness.name,
      slug,
      whatsapp: newBusiness.whatsapp || '+58414xxxxxxx',
      status: 'Activo',
      createdAt: new Date().toISOString().slice(0, 10),
      activatedAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      ownerEmail: newBusiness.email,
      merchantPasswordHash,
      productsCount: 0,
      initialProductsLoaded: false,
      graceDays: 0,
      };
      setBusinesses((current) => [createdBusiness, ...current]);
      setSelectedBusinessId(createdBusiness.id);
      setNewBusiness({ name: '', slug: '', whatsapp: '', email: '', password: '' });
      setActivePanel('admin');
    });
  };

  const selectBusinessForEdit = (business: Business) => {
    setSelectedBusinessId(business.id);
    setBusinessForm({ name: business.name, slug: business.slug, whatsapp: business.whatsapp, email: business.ownerEmail, password: '' });
  };

  const saveBusinessDetails = async () => {
    if (!businessForm.name.trim() || !businessForm.email.trim()) return;
    if (businessForm.password && businessForm.password.length < 8) return;
    const passwordHash = businessForm.password ? await hashMerchantPassword(businessForm.password) : undefined;
    setBusinesses((current) => current.map((business) => business.id === selectedBusinessId ? {
      ...business,
      name: businessForm.name.trim(),
      slug: businessForm.slug.trim() || businessForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      whatsapp: businessForm.whatsapp.trim(),
      ownerEmail: businessForm.email.trim(),
      ...(passwordHash ? { merchantPasswordHash: passwordHash } : {}),
    } : business));
    setBusinessForm((current) => ({ ...current, password: '' }));
  };

  const handleMerchantLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMerchantAuthError('');
    const email = merchantForm.email.trim().toLowerCase();
    const business = businesses.find((item) => item.ownerEmail.toLowerCase() === email);
    if (!business?.merchantPasswordHash || await hashMerchantPassword(merchantForm.password) !== business.merchantPasswordHash) {
      setMerchantAuthError('Correo o contraseña incorrectos. Confirma tus datos con el administrador.');
      setMerchantLoggedIn(false);
      return;
    }
    setSelectedBusinessId(business.id);
    setMerchantLoggedIn(true);
  };

  const toggleProductStatus = (productId: string) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, active: !product.active } : product,
      ),
    );
  };

  useEffect(() => {
    window.localStorage.setItem(businessesStorageKey, JSON.stringify(businesses));
  }, [businesses]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const restoreSession = async () => {
      const { data } = await client.auth.getSession();
      if (!data.session) return;

      const { data: profile } = await client
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single();

      if (profile?.role === 'admin') {
        setAdminLoggedIn(true);
        setActivePanel('admin');
      }
    };

    void restoreSession();
  }, []);

  const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');

    if (!isSupabaseConfigured && adminForm.password === 'Propaul1') {
      setAdminLoggedIn(true);
      setActivePanel('admin');
      return;
    }

    const client = supabase;
    if (!client || !isSupabaseConfigured) {
      setAuthError('Falta la URL real del proyecto de Supabase para habilitar el acceso autenticado.');
      setAdminLoggedIn(false);
      return;
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: adminForm.email,
        password: adminForm.password,
      });

      if (error || !data.user) {
        setAuthError(error?.message ?? 'No se pudo iniciar sesión.');
        setAdminLoggedIn(false);
        return;
      }

      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        await client.auth.signOut();
        setAuthError('Este usuario no tiene permisos de administrador.');
        setAdminLoggedIn(false);
        return;
      }

      setAdminLoggedIn(true);
      setActivePanel('admin');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Error inesperado al iniciar sesión.');
      setAdminLoggedIn(false);
    }
  };

  const handleCatalogCheckout = () => {
    if (cartItems.length === 0) return;
    const message = encodeURIComponent(buildWhatsAppMessage(cartItems.map(({ name, quantity, price }) => ({ name, quantity, price }))));
    const whatsappLink = `https://wa.me/${selectedBusiness.whatsapp.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
  };

  const downloadQrCode = () => {
    if (!qrSvgElement) return;
    const svg = new XMLSerializer().serializeToString(qrSvgElement);
    const image = new Image();
    const imageUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const context = canvas.getContext('2d');
      if (!context) return URL.revokeObjectURL(imageUrl);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(imageUrl);
      const link = document.createElement('a');
      link.download = `qr-${selectedBusiness.slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    image.onerror = () => URL.revokeObjectURL(imageUrl);
    image.src = imageUrl;
  };

  const publicUrl = `${window.location.origin}/tienda/${encodeURIComponent(selectedBusiness.slug)}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Catálogo Fácil</p>
              <h1 className="text-lg font-semibold text-slate-900">Catálogo Fácil</h1>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <button className={activePanel === 'home' ? 'text-slate-900' : 'text-slate-600'} onClick={() => setActivePanel('home')}>Inicio</button>
            <button className={activePanel === 'catalog' ? 'text-slate-900' : 'text-slate-600'} onClick={() => setActivePanel('catalog')}>Catálogo</button>
            <button className={activePanel === 'admin' ? 'text-slate-900' : 'text-slate-600'} onClick={() => setActivePanel('admin')}>Panel maestro</button>
            <button className={activePanel === 'merchant' ? 'text-slate-900' : 'text-slate-600'} onClick={() => setActivePanel('merchant')}>Comerciante</button>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 sm:inline-flex">
              {getSupabaseStatusMessage()}
            </span>
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              onClick={() => setActivePanel(adminLoggedIn ? 'admin' : 'home')}
            >
              {adminLoggedIn ? 'Dashboard' : 'Acceder'}
            </button>
          </div>
        </div>
      </header>

      {activePanel === 'home' && (
        <main className="mx-auto max-w-7xl space-y-16 px-4 py-10 sm:px-6 lg:px-8">
          <section className="grid gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6 text-white shadow-2xl lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-emerald-100">
                <Sparkles className="h-3.5 w-3.5" />
                Platforma real para comercios pequeños
              </div>
              <div className="space-y-4">
                <h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Catálogo Fácil para negocios locales con ventas por WhatsApp.
                </h2>
                <p className="max-w-xl text-base text-slate-300">
                  Un sistema profesional para crear catálogos públicos, gestionar productos, controlar pagos y activar negocios con una sola plataforma.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
                  onClick={() => setActivePanel('admin')}
                >
                  Ver panel maestro
                </button>
                <button
                  className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  onClick={() => setActivePanel('catalog')}
                >
                  Explorar catálogo demo
                </button>
              </div>
              <div className="grid gap-3 pt-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-bold">30 USD</p>
                  <p className="text-sm text-slate-300">Creación del catálogo</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-bold">5 USD</p>
                  <p className="text-sm text-slate-300">Mensualidad</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-bold">20</p>
                  <p className="text-sm text-slate-300">Productos iniciales</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">Resumen</p>
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-sm text-slate-300">Negocios activos</p>
                    <p className="mt-2 text-3xl font-semibold">{adminMetrics.activeCount}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-800 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vencidos</p>
                      <p className="mt-2 text-2xl font-semibold">{adminMetrics.expiredCount}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-800 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Suspendidos</p>
                      <p className="mt-2 text-2xl font-semibold">{adminMetrics.suspendedCount}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    <div className="flex items-center justify-between gap-3">
                      <span>Supervisión de pagos</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="mt-2 text-xs leading-6 text-emerald-50/80">
                      Registro manual, historial de pagos, días de gracia y reactivación bajo control del administrador.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Building2, title: 'Multi negocio', description: 'Cada comercio tiene su propio slug y catálogo público.' },
              { icon: Wallet, title: 'Pagos manuales', description: 'Alta, mensualidad y vencimientos controlados por el administrador.' },
              { icon: ShoppingCart, title: 'Carrito por WhatsApp', description: 'Los clientes revisan el pedido y lo confirman en WhatsApp.' },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </section>
        </main>
      )}

      {activePanel === 'admin' && (
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {!adminLoggedIn ? (
            <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Acceso protegido</p>
                  <h3 className="text-xl font-semibold text-slate-900">Panel maestro</h3>
                </div>
              </div>
              <form className="space-y-4" onSubmit={handleAdminLogin}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Correo</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-emerald-500"
                    type="email"
                    value={adminForm.email}
                    onChange={(event) => setAdminForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Contraseña</span>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-emerald-500"
                    type="password"
                    value={adminForm.password}
                    onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))}
                  />
                </label>
                <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700" type="submit">
                  Ingresar al dashboard
                </button>
                {authError && <p className="mt-3 text-sm text-rose-600">{authError}</p>}
              </form>
              <p className="mt-4 text-xs leading-6 text-slate-500">
                Acceso local de respaldo: la contraseña maestra es Propaul1. Cuando la URL real de Supabase esté configurada, el sistema usará autenticación real con perfiles y permisos.
              </p>
            </section>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-4">
                <StatCard label="Negocios activos" value={String(adminMetrics.activeCount)} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
                <StatCard label="Suspendidos" value={String(adminMetrics.suspendedCount)} icon={<BarChart3 className="h-5 w-5" />} tone="amber" />
                <StatCard label="Vencidos" value={String(adminMetrics.expiredCount)} icon={<ShieldCheck className="h-5 w-5" />} tone="rose" />
                <StatCard label="Productos" value={String(adminMetrics.totalProducts)} icon={<Package className="h-5 w-5" />} tone="slate" />
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Negocios</p>
                      <h3 className="text-2xl font-semibold text-slate-900">Administración</h3>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <Search className="h-4 w-4 text-slate-500" />
                      <input
                        className="w-48 bg-transparent text-sm outline-none placeholder:text-slate-400"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar negocio"
                      />
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {(['Todos', 'Activo', 'Suspendido', 'Vencido'] as const).map((option) => (
                      <button
                        key={option}
                        className={statusFilter === option ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white' : 'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600'}
                        onClick={() => setStatusFilter(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {filteredBusinesses.map((business) => (
                      <button
                        key={business.id}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-slate-100"
                        onClick={() => selectBusinessForEdit(business)}
                      >
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-slate-900">{business.name}</p>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${statusStyles[business.status]}`}>
                              {business.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">/{business.slug} · WhatsApp {business.whatsapp}</p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p>{business.productsCount} productos</p>
                          <p>Vence: {business.expiresAt}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Negocio seleccionado</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">Editar o crear catálogo</h3>
                  <div className="mt-5 space-y-4">
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium">Nombre del negocio</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                        value={businessForm.name}
                        onChange={(event) => setBusinessForm((current) => ({ ...current, name: event.target.value }))}
                      />
                    </label>
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium">Slug</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                        value={businessForm.slug}
                        onChange={(event) => setBusinessForm((current) => ({ ...current, slug: event.target.value }))}
                        placeholder="mi-negocio"
                      />
                    </label>
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium">WhatsApp</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                        value={businessForm.whatsapp}
                        onChange={(event) => setBusinessForm((current) => ({ ...current, whatsapp: event.target.value }))}
                        placeholder="+58414..."
                      />
                    </label>
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium">Correo del comerciante</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                        type="email"
                        value={businessForm.email}
                        onChange={(event) => setBusinessForm((current) => ({ ...current, email: event.target.value }))}
                      />
                    </label>
                    <label className="block text-sm text-slate-700">
                      <span className="mb-2 block font-medium">Contraseña del panel de comerciante</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                        type="password"
                        minLength={8}
                        value={businessForm.password}
                        onChange={(event) => setBusinessForm((current) => ({ ...current, password: event.target.value }))}
                        placeholder="Dejar en blanco para mantener la actual"
                      />
                    </label>
                    <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => void saveBusinessDetails()} disabled={!businessForm.name.trim() || !businessForm.email.trim() || Boolean(businessForm.password && businessForm.password.length < 8)}>
                      Guardar cambios del negocio
                    </button>
                    <div className="border-t border-slate-200 pt-4">
                      <p className="mb-3 text-sm font-semibold text-slate-800">Crear un nuevo negocio</p>
                      <div className="space-y-3">
                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" placeholder="Nombre del negocio" value={newBusiness.name} onChange={(event) => setNewBusiness((current) => ({ ...current, name: event.target.value }))} />
                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" placeholder="Slug (opcional)" value={newBusiness.slug} onChange={(event) => setNewBusiness((current) => ({ ...current, slug: event.target.value }))} />
                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" placeholder="WhatsApp" value={newBusiness.whatsapp} onChange={(event) => setNewBusiness((current) => ({ ...current, whatsapp: event.target.value }))} />
                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" type="email" placeholder="Correo del comerciante" value={newBusiness.email} onChange={(event) => setNewBusiness((current) => ({ ...current, email: event.target.value }))} />
                        <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" type="password" minLength={8} placeholder="Contraseña (mínimo 8 caracteres)" value={newBusiness.password} onChange={(event) => setNewBusiness((current) => ({ ...current, password: event.target.value }))} />
                      </div>
                    </div>
                    <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50" onClick={addBusiness} disabled={!newBusiness.name.trim() || !newBusiness.email.trim() || newBusiness.password.length < 8}>
                      Crear negocio y activar catálogo
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Pagos</p>
                    <h3 className="text-2xl font-semibold text-slate-900">Historial de pagos</h3>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                    <CreditCard className="h-4 w-4" />
                    Registrar pago
                  </button>
                </div>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{businesses.find((business) => business.id === payment.businessId)?.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{payment.period} · {payment.kind}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatMoney(payment.amount)}</p>
                        <p className="text-xs text-slate-500">{payment.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      )}

      {activePanel === 'merchant' && (
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {!merchantLoggedIn ? (
            <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white"><Store className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Acceso del comerciante</p>
                  <h3 className="text-xl font-semibold text-slate-900">Ingresa a tu catálogo</h3>
                </div>
              </div>
              <form className="space-y-4" onSubmit={handleMerchantLogin}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Correo del negocio</span>
                  <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" type="email" required value={merchantForm.email} onChange={(event) => setMerchantForm((current) => ({ ...current, email: event.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Contraseña</span>
                  <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" type="password" required value={merchantForm.password} onChange={(event) => setMerchantForm((current) => ({ ...current, password: event.target.value }))} />
                </label>
                <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700" type="submit">Ingresar al panel</button>
                {merchantAuthError && <p className="text-sm text-rose-600">{merchantAuthError}</p>}
              </form>
              <p className="mt-4 text-xs leading-5 text-slate-500">Si aún no tienes contraseña, solicítala al administrador de Catálogo Fácil.</p>
            </section>
          ) : (
            <>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Panel del comerciante</p>
                <h3 className="mt-2 text-3xl font-semibold text-slate-900">{selectedBusiness.name}</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700" onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}>
                  Ver enlace público
                </button>
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => document.getElementById('business-qr')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                  Generar QR
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Productos activos" value={String(merchantSummary.enabledProducts)} icon={<Package className="h-5 w-5" />} tone="emerald" />
              <StatCard label="Productos pausados" value={String(merchantSummary.pendingProducts)} icon={<Zap className="h-5 w-5" />} tone="amber" />
              <StatCard label="Estado" value={selectedBusiness.status} icon={<CheckCircle2 className="h-5 w-5" />} tone="slate" />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Productos</p>
                  <h3 className="text-2xl font-semibold text-slate-900">Gestión del catálogo</h3>
                </div>
                <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Añadir producto</button>
              </div>

              <div className="space-y-3">
                {products
                  .filter((product) => product.businessId === selectedBusiness.id)
                  .map((product) => (
                    <div key={product.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
                        <div>
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.category} · {formatMoney(product.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className={product.active ? 'rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-800' : 'rounded-full bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700'}
                          onClick={() => toggleProductStatus(product.id)}
                        >
                          {product.active ? 'Activo' : 'Inactivo'}
                        </button>
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">Editar</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-6">
              <div id="business-qr" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Código QR</p>
                    <h3 className="text-xl font-semibold text-slate-900">Catálogo público</h3>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mx-auto flex max-w-[240px] justify-center bg-white p-3">
                    <QRCodeSVG
                      ref={setQrSvgElement}
                      value={publicUrl}
                      size={220}
                      level="H"
                      marginSize={4}
                      bgColor="#ffffff"
                      fgColor="#111827"
                      title={`Catálogo de ${selectedBusiness.name}`}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <a className="break-all text-xs text-slate-600 underline decoration-slate-300 underline-offset-2" href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a>
                  <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700" onClick={downloadQrCode}>
                    <Download className="h-4 w-4" />
                    Descargar QR PNG
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Suscripción</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Estado del negocio</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <span>Estado</span>
                    <span className={`rounded-full px-2 py-1 text-xs ${statusStyles[selectedBusiness.status]}`}>{selectedBusiness.status}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <span>Vencimiento</span>
                    <span>{selectedBusiness.expiresAt}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <span>Soporte</span>
                    <span>admin@catalogofacil.ve</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
            </>
          )}
        </main>
      )}

      {activePanel === 'catalog' && (
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Catálogo público</p>
                <h3 className="mt-2 text-3xl font-semibold text-slate-900">{selectedBusiness.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{selectedBusiness.whatsapp} · {publicUrl}</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  className="w-56 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Buscar producto"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  className={catalogFilter === category ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white' : 'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600'}
                  onClick={() => setCatalogFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {publicProducts.filter((product) => product.name.toLowerCase().includes(search.toLowerCase())).map((product) => (
                <article key={product.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative">
                    <img src={product.image} alt={product.name} className="h-52 w-full object-cover" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-700">
                      {product.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{product.name}</h4>
                        <p className="mt-1 text-sm text-slate-500">{product.description}</p>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">{formatMoney(product.price)}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
                        <button className="h-7 w-7 rounded-md bg-white text-slate-600" onClick={() => updateCart(product.id, -1)}>-</button>
                        <span className="min-w-6 text-center text-sm font-medium text-slate-700">{cart[product.id] ?? 0}</span>
                        <button className="h-7 w-7 rounded-md bg-white text-slate-600" onClick={() => updateCart(product.id, 1)}>+</button>
                      </div>
                      <button className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white" onClick={() => updateCart(product.id, 1)}>
                        Añadir
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Carrito</p>
                  <h3 className="text-2xl font-semibold text-slate-900">Pedido</h3>
                </div>
                <ShoppingCart className="h-5 w-5 text-slate-500" />
              </div>

              <div className="space-y-3">
                {cartItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Aún no hay productos seleccionados.
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div>
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} x {formatMoney(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{formatMoney(item.quantity * item.price)}</span>
                        <button className="text-xs text-slate-500" onClick={() => removeFromCart(item.id)}>Eliminar</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(totalCart)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Envío</span>
                  <span>{totalCart > 0 ? formatMoney(12) : formatMoney(0)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatMoney(totalCart + (totalCart > 0 ? 12 : 0))}</span>
                </div>
                <button className="flex w-full items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white" onClick={handleCatalogCheckout}>
                  Enviar pedido por WhatsApp
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </aside>
          </section>
        </main>
      )}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Catálogo Fácil</p>
              <p className="text-xs text-slate-500">Diseñado para pequeños comercios en Venezuela</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4" /> Entrega por WhatsApp</span>
            <span className="inline-flex items-center gap-2"><ImageIcon className="h-4 w-4" /> QR y catálogo público</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Seguridad con Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    slate: 'bg-slate-200 text-slate-700',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[tone]}`}>{icon}</div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
