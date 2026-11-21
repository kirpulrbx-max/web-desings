import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { businesses as businessSeed, initialProducts, payments as paymentSeed, type Business, type BusinessStatus, type Payment, type Product } from '../data/mock';
import { buildWhatsAppLink, buildWhatsAppMessage, parsePrice, slugify, todayIso } from '../lib/format';
import { prepareProductImage, readFileAsDataUrl } from '../lib/image';
import { deleteProductImage, uploadProductImage } from '../lib/storage';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type Panel = 'home' | 'admin' | 'merchant' | 'catalog';

export type NewBusinessForm = { name: string; slug: string; whatsapp: string; email: string; password: string };
export type BusinessForm = NewBusinessForm;

export type PaymentForm = { amount: string; date: string; period: string; notes: string; kind: 'Inicial' | 'Mensual' };

export type ProductForm = { name: string; category: string; price: string; description: string; active: boolean };

export type EditorImage =
  | { kind: 'none' }
  | { kind: 'existing'; url: string }
  | { kind: 'url'; url: string }
  | { kind: 'new'; file: File; previewUrl: string; originalBytes: number };

export type ProductEditorState = {
  open: boolean;
  productId: string | null;
  form: ProductForm;
  image: EditorImage;
  processingImage: boolean;
  saving: boolean;
  error: string;
};

export type Toast = { id: number; text: string; tone: 'success' | 'error' };

export const useLocalDemo = import.meta.env.DEV && !isSupabaseConfigured;
const businessesStorageKey = 'catalogo-facil-businesses';
const productsStorageKey = 'catalogo-facil-products';

const publicAppBaseUrl = (
  import.meta.env.VITE_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
).replace(/\/+$/, '');

const emptyBusiness: Business = {
  id: '',
  name: 'Tienda',
  slug: '',
  whatsapp: '',
  status: 'Vencido',
  createdAt: '',
  activatedAt: null,
  expiresAt: '',
  ownerEmail: '',
  productsCount: 0,
  initialProductsLoaded: false,
  graceDays: 0,
};

const emptyProductForm = (category = ''): ProductForm => ({ name: '', category, price: '', description: '', active: true });
const closedEditor: ProductEditorState = {
  open: false,
  productId: null,
  form: emptyProductForm(),
  image: { kind: 'none' },
  processingImage: false,
  saving: false,
  error: '',
};

export const getStoreSlugFromPath = () => {
  if (typeof window === 'undefined') return '';
  const match = window.location.pathname.match(/^\/tienda\/([^/]+)\/?$/);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // El almacenamiento puede estar lleno (fotos en base64) o bloqueado; el demo sigue en memoria.
  }
};

const hashMerchantPassword = async (password: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const fromDatabaseStatus = (status: string): BusinessStatus => {
  if (status === 'activo') return 'Activo';
  if (status === 'suspendido') return 'Suspendido';
  return 'Vencido';
};

const toDatabaseStatus = (status: BusinessStatus) => status.toLowerCase();

const explainDbError = (step: string, message: string) =>
  /row-level security|permission denied|not authorized/i.test(message)
    ? `Permiso denegado al ${step}. Si eres el administrador, ejecuta supabase/migrations/005_fix_storage_and_catalog_policies.sql en el SQL Editor de Supabase y vuelve a intentar. (${message})`
    : /duplicate key|unique/i.test(message)
      ? `Ya existe un registro con ese nombre o enlace. Usa otro (${step}).`
      : `Error al ${step}: ${message}`;

const getFunctionErrorMessage = async (error: { message?: string; context?: unknown }) => {
  const context = error.context;
  if (context instanceof Response) {
    try {
      const payload = (await context.clone().json()) as { error?: string };
      if (payload?.error) return payload.error;
    } catch {
      // se usa el mensaje genérico
    }
  }
  return error.message || 'No se pudo completar la operación en el servidor.';
};

const notConfiguredMessage = 'No se puede guardar: configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel y vuelve a desplegar.';

export function useCatalogApp() {
  const [activePanel, setActivePanel] = useState<Panel>(() => (getStoreSlugFromPath() ? 'catalog' : 'home'));
  const [storeLoading, setStoreLoading] = useState(() => Boolean(getStoreSlugFromPath()) && isSupabaseConfigured);
  const [businesses, setBusinesses] = useState<Business[]>(() => (useLocalDemo ? readStorage(businessesStorageKey, businessSeed) : []));
  const [products, setProducts] = useState<Product[]>(() => (useLocalDemo ? readStorage(productsStorageKey, initialProducts) : []));
  const [payments, setPayments] = useState<Payment[]>(() => (useLocalDemo ? paymentSeed : []));
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(useLocalDemo ? businessSeed[0].id : '');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [merchantLoggedIn, setMerchantLoggedIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [merchantAuthError, setMerchantAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [requestedStoreUnavailable, setRequestedStoreUnavailable] = useState(false);
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const [editor, setEditor] = useState<ProductEditorState>(closedEditor);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [businessForm, setBusinessForm] = useState<BusinessForm>({
    name: useLocalDemo ? businessSeed[0].name : '',
    slug: useLocalDemo ? businessSeed[0].slug : '',
    whatsapp: useLocalDemo ? businessSeed[0].whatsapp : '',
    email: useLocalDemo ? businessSeed[0].ownerEmail : '',
    password: '',
  });
  const editorRef = useRef(editor);
  editorRef.current = editor;

  const notify = useCallback((text: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3500);
  }, []);

  const selectedBusiness =
    businesses.find((business) => business.id === selectedBusinessId) ?? businesses[0] ?? (useLocalDemo ? businessSeed[0] : emptyBusiness);
  const hasSelectedBusiness = businesses.some((business) => business.id === selectedBusinessId);
  const canWrite = isSupabaseConfigured || useLocalDemo;

  const businessProducts = useMemo(
    () => products.filter((product) => product.businessId === selectedBusiness.id),
    [products, selectedBusiness.id],
  );

  const businessCategories = useMemo(
    () => [...new Set(businessProducts.map((product) => product.category.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [businessProducts],
  );

  // Corrección: antes faltaba el estado del negocio en las dependencias del memo.
  const publicProducts = useMemo(
    () => (selectedBusiness.status === 'Activo' ? businessProducts.filter((product) => product.active) : []),
    [businessProducts, selectedBusiness.status],
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => {
          const item = products.find((product) => product.id === productId);
          if (!item || quantity <= 0 || item.businessId !== selectedBusiness.id || !item.active) return null;
          return { ...item, quantity };
        })
        .filter(Boolean) as Array<Product & { quantity: number }>,
    [cart, products, selectedBusiness.id],
  );
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const adminMetrics = useMemo(
    () => ({
      activeCount: businesses.filter((business) => business.status === 'Activo').length,
      suspendedCount: businesses.filter((business) => business.status === 'Suspendido').length,
      expiredCount: businesses.filter((business) => business.status === 'Vencido').length,
      totalProducts: products.length,
    }),
    [businesses, products],
  );

  const publicUrl = `${publicAppBaseUrl}/tienda/${encodeURIComponent(selectedBusiness.slug)}`;

  /* ------------------------------ Carrito ------------------------------ */

  const updateCart = (productId: string, delta: number) => {
    setCart((current) => {
      const nextValue = Math.max((current[productId] ?? 0) + delta, 0);
      const result = { ...current };
      if (nextValue === 0) delete result[productId];
      else result[productId] = Math.min(nextValue, 99);
      return result;
    });
  };

  const clearCart = () => setCart({});

  const checkoutUrl = cartItems.length
    ? buildWhatsAppLink(
        selectedBusiness.whatsapp,
        buildWhatsAppMessage(selectedBusiness.name, cartItems.map(({ name, quantity, price }) => ({ name, quantity, price }))),
      )
    : '';

  /* ------------------------------ Negocios ----------------------------- */

  const addBusiness = async (form: NewBusinessForm) => {
    if (!canWrite) return setDataError(notConfiguredMessage), false;
    if (creatingBusiness) return false;
    if (!form.name.trim() || !form.email.trim()) return false;
    if (form.password.length < 8) {
      setDataError('La contraseña del comerciante debe tener al menos 8 caracteres.');
      return false;
    }
    setDataError('');
    const slug = slugify(form.slug.trim() || form.name);
    const today = todayIso();
    let createdBusiness: Business = {
      id: `biz-${Date.now()}`,
      name: form.name.trim(),
      slug,
      whatsapp: form.whatsapp.trim(),
      status: 'Activo',
      createdAt: today,
      activatedAt: today,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      ownerEmail: form.email.trim(),
      productsCount: 0,
      initialProductsLoaded: false,
      graceDays: 0,
    };
    if (isSupabaseConfigured && supabase) {
      setCreatingBusiness(true);
      try {
        const { data, error } = await supabase.functions.invoke('create-merchant', {
          body: { name: form.name.trim(), slug, whatsapp: form.whatsapp.trim(), email: form.email.trim(), password: form.password },
        });
        if (error) {
          setDataError(await getFunctionErrorMessage(error));
          return false;
        }
        const remote = data?.business;
        if (!remote?.id) {
          setDataError('El servidor no devolvió el negocio creado. Revisa que la función create-merchant esté desplegada en Supabase.');
          return false;
        }
        createdBusiness = {
          ...createdBusiness,
          id: remote.id,
          name: remote.name,
          slug: remote.slug,
          whatsapp: remote.whatsapp ?? '',
          createdAt: remote.created_at?.slice(0, 10) ?? createdBusiness.createdAt,
          activatedAt: remote.activated_at?.slice(0, 10) ?? createdBusiness.activatedAt,
          expiresAt: remote.expires_at?.slice(0, 10) ?? createdBusiness.expiresAt,
          ownerEmail: remote.owner_email ?? createdBusiness.ownerEmail,
        };
      } catch (error) {
        setDataError(error instanceof Error ? error.message : 'No se pudo crear el negocio.');
        return false;
      } finally {
        setCreatingBusiness(false);
      }
    } else {
      createdBusiness = { ...createdBusiness, merchantPasswordHash: await hashMerchantPassword(form.password) };
    }
    setBusinesses((current) => [createdBusiness, ...current]);
    selectBusinessForEdit(createdBusiness);
    notify(`Tienda "${createdBusiness.name}" creada.`);
    return true;
  };

  const selectBusinessForEdit = (business: Business) => {
    setSelectedBusinessId(business.id);
    setBusinessForm({ name: business.name, slug: business.slug, whatsapp: business.whatsapp, email: business.ownerEmail, password: '' });
  };

  const saveBusinessDetails = async () => {
    if (!canWrite) return setDataError(notConfiguredMessage);
    if (!hasSelectedBusiness || !businessForm.name.trim()) return;
    if (!isSupabaseConfigured && (!businessForm.email.trim() || (businessForm.password && businessForm.password.length < 8))) return;
    const passwordHash = !isSupabaseConfigured && businessForm.password ? await hashMerchantPassword(businessForm.password) : undefined;
    const updatedBusiness: Business = {
      ...selectedBusiness,
      name: businessForm.name.trim(),
      slug: slugify(businessForm.slug.trim() || businessForm.name),
      whatsapp: businessForm.whatsapp.trim(),
      ownerEmail: isSupabaseConfigured ? selectedBusiness.ownerEmail : businessForm.email.trim(),
      ...(passwordHash ? { merchantPasswordHash: passwordHash } : {}),
    };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('businesses')
        .update({ name: updatedBusiness.name, slug: updatedBusiness.slug, whatsapp: updatedBusiness.whatsapp })
        .eq('id', selectedBusinessId);
      if (error) return setDataError(explainDbError('guardar el negocio', error.message));
    }
    setBusinesses((current) => current.map((business) => (business.id === selectedBusinessId ? updatedBusiness : business)));
    setBusinessForm((current) => ({ ...current, slug: updatedBusiness.slug, password: '' }));
    setDataError('');
    notify('Cambios del negocio guardados.');
  };

  const toggleBusinessStatus = async (businessId: string) => {
    if (!canWrite) return setDataError(notConfiguredMessage);
    const business = businesses.find((item) => item.id === businessId);
    if (!business) return;
    const nextStatus: BusinessStatus = business.status === 'Activo' ? 'Suspendido' : 'Activo';
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('businesses').update({ status: toDatabaseStatus(nextStatus) }).eq('id', businessId);
      if (error) return setDataError(explainDbError('cambiar el estado', error.message));
    }
    setBusinesses((current) =>
      current.map((item) =>
        item.id === businessId
          ? { ...item, status: nextStatus, activatedAt: nextStatus === 'Suspendido' ? item.activatedAt : todayIso() }
          : item,
      ),
    );
    setDataError('');
    notify(nextStatus === 'Activo' ? `${business.name} activada.` : `${business.name} suspendida.`);
  };

  /* ------------------------------ Pagos -------------------------------- */

  const savePayment = async (form: PaymentForm) => {
    setDataError('');
    if (!canWrite) return setDataError(notConfiguredMessage), false;
    const amount = parsePrice(form.amount);
    if (!hasSelectedBusiness || !Number.isFinite(amount) || amount <= 0 || !form.date) {
      setDataError('Revisa el monto y la fecha del pago.');
      return false;
    }
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      businessId: selectedBusinessId,
      amount,
      date: form.date,
      period: form.period.trim() || form.kind,
      notes: form.notes.trim(),
      kind: form.kind,
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          business_id: selectedBusinessId,
          amount,
          payment_date: payment.date,
          period_covered: payment.period,
          notes: payment.notes,
          kind: payment.kind === 'Inicial' ? 'inicial' : 'mensual',
        })
        .select('id')
        .single();
      if (error) {
        setDataError(explainDbError('registrar el pago', error.message));
        return false;
      }
      payment.id = data.id;
    }
    setPayments((current) => [payment, ...current]);
    notify('Pago registrado.');
    return true;
  };

  /* ------------------------------ Productos ---------------------------- */

  const revokePreview = (image: EditorImage) => {
    if (image.kind === 'new') URL.revokeObjectURL(image.previewUrl);
  };

  const openNewProduct = (category = '') => {
    revokePreview(editorRef.current.image);
    setEditor({ ...closedEditor, open: true, form: emptyProductForm(category) });
  };

  const openEditProduct = (product: Product) => {
    revokePreview(editorRef.current.image);
    setEditor({
      ...closedEditor,
      open: true,
      productId: product.id,
      form: { name: product.name, category: product.category, price: String(product.price), description: product.description, active: product.active },
      image: product.image ? { kind: 'existing', url: product.image } : { kind: 'none' },
    });
  };

  const closeEditor = () => {
    if (editorRef.current.saving) return;
    revokePreview(editorRef.current.image);
    setEditor(closedEditor);
  };

  const setEditorField = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) =>
    setEditor((current) => ({ ...current, form: { ...current.form, [field]: value }, error: '' }));

  const selectEditorImage = async (file?: File | null) => {
    if (!file) return;
    setEditor((current) => ({ ...current, processingImage: true, error: '' }));
    try {
      const prepared = await prepareProductImage(file);
      setEditor((current) => {
        revokePreview(current.image);
        return {
          ...current,
          processingImage: false,
          image: { kind: 'new', file: prepared.file, previewUrl: prepared.previewUrl, originalBytes: file.size },
        };
      });
    } catch (error) {
      setEditor((current) => ({
        ...current,
        processingImage: false,
        error: error instanceof Error ? error.message : 'No se pudo procesar la foto.',
      }));
    }
  };

  const setEditorImageUrl = (url: string) =>
    setEditor((current) => {
      revokePreview(current.image);
      return { ...current, image: url.trim() ? { kind: 'url', url: url.trim() } : { kind: 'none' }, error: '' };
    });

  const removeEditorImage = () =>
    setEditor((current) => {
      revokePreview(current.image);
      return { ...current, image: { kind: 'none' } };
    });

  const ensureCategoryId = async (businessId: string, name: string) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { data: existing, error: findError } = await supabase
      .from('categories')
      .select('id')
      .eq('business_id', businessId)
      .eq('name', name)
      .maybeSingle();
    if (findError) throw new Error(explainDbError('leer la categoría', findError.message));
    if (existing?.id) return existing.id as string;
    const { data: created, error: createError } = await supabase
      .from('categories')
      .insert({ business_id: businessId, name })
      .select('id')
      .single();
    if (createError) throw new Error(explainDbError('crear la categoría', createError.message));
    return created.id as string;
  };

  const persistProduct = async (product: Product, isNew: boolean) => {
    if (!isSupabaseConfigured || !supabase) return product;
    const categoryId = await ensureCategoryId(product.businessId, product.category);
    const row = {
      business_id: product.businessId,
      category_id: categoryId,
      name: product.name,
      description: product.description,
      price: product.price,
      is_active: product.active,
      image_url: product.image || null,
    };
    if (isNew) {
      const { data, error } = await supabase.from('products').insert(row).select('id').single();
      if (error) throw new Error(explainDbError('guardar el producto', error.message));
      return { ...product, id: data.id as string };
    }
    const { error } = await supabase.from('products').update(row).eq('id', product.id);
    if (error) throw new Error(explainDbError('guardar el producto', error.message));
    return product;
  };

  const saveProduct = async (event?: FormEvent<HTMLFormElement>, options: { addAnother?: boolean } = {}) => {
    event?.preventDefault();
    const current = editorRef.current;
    if (current.saving || current.processingImage) return;
    const fail = (error: string) => setEditor((state) => ({ ...state, saving: false, error }));

    if (!canWrite) return fail(notConfiguredMessage);
    if (isSupabaseConfigured && !hasSelectedBusiness) return fail('Selecciona o crea una tienda real antes de guardar productos.');
    const name = current.form.name.trim();
    const category = current.form.category.trim();
    const price = parsePrice(current.form.price);
    if (!name) return fail('Escribe el nombre del producto.');
    if (!category) return fail('Indica una categoría (por ejemplo: Bebidas).');
    if (!Number.isFinite(price) || price <= 0) return fail('Escribe un precio válido mayor que 0, por ejemplo 2,50.');

    setEditor((state) => ({ ...state, saving: true, error: '' }));
    const previous = current.productId ? products.find((item) => item.id === current.productId) : undefined;
    const businessId = previous?.businessId ?? selectedBusiness.id;

    try {
      let imageUrl = '';
      if (current.image.kind === 'existing' || current.image.kind === 'url') imageUrl = current.image.url;
      if (current.image.kind === 'new') {
        imageUrl = isSupabaseConfigured && supabase
          ? await uploadProductImage(supabase, businessId, current.image.file).catch((error: { message?: string }) => {
              throw new Error(explainDbError('subir la foto', error?.message ?? 'error desconocido'));
            })
          : await readFileAsDataUrl(current.image.file);
      }

      const saved = await persistProduct(
        {
          id: previous?.id ?? `prod-${Date.now()}`,
          businessId,
          name,
          category,
          price,
          description: current.form.description.trim(),
          active: current.form.active,
          image: imageUrl,
        },
        !previous,
      );

      // La foto anterior ya no se usa: se borra del bucket para no acumular archivos.
      if (supabase && previous?.image && previous.image !== saved.image) void deleteProductImage(supabase, previous.image);

      setProducts((list) => (previous ? list.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...list]));
      if (!previous) {
        setBusinesses((list) => list.map((business) => (business.id === businessId ? { ...business, productsCount: business.productsCount + 1 } : business)));
      }
      notify(previous ? 'Producto actualizado.' : 'Producto publicado.');
      revokePreview(current.image);
      setEditor(options.addAnother && !previous ? { ...closedEditor, open: true, form: emptyProductForm(category) } : closedEditor);
    } catch (error) {
      fail(error instanceof Error ? error.message : 'No se pudo guardar el producto.');
    }
  };

  const toggleProductStatus = async (productId: string) => {
    if (!canWrite) return setDataError(notConfiguredMessage);
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').update({ is_active: !product.active }).eq('id', productId);
      if (error) return setDataError(explainDbError('cambiar la visibilidad', error.message));
    }
    setProducts((list) => list.map((item) => (item.id === productId ? { ...item, active: !item.active } : item)));
    setDataError('');
  };

  const duplicateProduct = async (product: Product) => {
    if (!canWrite) return setDataError(notConfiguredMessage);
    try {
      const copy = await persistProduct({ ...product, id: `prod-${Date.now()}`, name: `${product.name} (copia)`, active: false }, true);
      setProducts((list) => [copy, ...list]);
      setBusinesses((list) => list.map((business) => (business.id === product.businessId ? { ...business, productsCount: business.productsCount + 1 } : business)));
      notify('Copia creada (oculta). Edítala y actívala cuando esté lista.');
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'No se pudo duplicar el producto.');
    }
  };

  const removeProduct = async (productId: string) => {
    setDataError('');
    if (!canWrite) return setDataError(notConfiguredMessage);
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) return setDataError(explainDbError('eliminar el producto', error.message));
      // Solo se borra la foto si ningún otro producto (p. ej. una copia) la usa.
      if (!products.some((item) => item.id !== productId && item.image === product.image)) void deleteProductImage(supabase, product.image);
    }
    setProducts((list) => list.filter((item) => item.id !== productId));
    setBusinesses((list) =>
      list.map((business) => (business.id === product.businessId ? { ...business, productsCount: Math.max(0, business.productsCount - 1) } : business)),
    );
    notify('Producto eliminado.');
  };

  /* ------------------------------ Sesiones ----------------------------- */

  const loginMerchant = async (emailInput: string, password: string) => {
    setMerchantAuthError('');
    const email = emailInput.trim().toLowerCase();
    if (isSupabaseConfigured && supabase) {
      setAuthLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) {
          setMerchantAuthError(error?.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error?.message ?? 'No se pudo iniciar sesión.');
          return;
        }
        const { data: owned, error: businessError } = await supabase.from('businesses').select('id').eq('owner_id', data.user.id).limit(1);
        if (businessError || !owned?.length) {
          await supabase.auth.signOut();
          setMerchantAuthError(businessError?.message ?? 'Esta cuenta todavía no tiene una tienda asignada.');
          return;
        }
        setMerchantLoggedIn(true);
        setActivePanel('merchant');
      } finally {
        setAuthLoading(false);
      }
      return;
    }
    if (!useLocalDemo) {
      setMerchantAuthError('Supabase no está configurado en producción. Contacta al administrador.');
      return;
    }
    const business = businesses.find((item) => item.ownerEmail.toLowerCase() === email);
    if (!business?.merchantPasswordHash || (await hashMerchantPassword(password)) !== business.merchantPasswordHash) {
      setMerchantAuthError('Correo o contraseña incorrectos. Confirma tus datos con el administrador.');
      setMerchantLoggedIn(false);
      return;
    }
    setSelectedBusinessId(business.id);
    setMerchantLoggedIn(true);
  };

  const loginAdmin = async (email: string, password: string) => {
    setAuthError('');
    const demoAdminPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD as string | undefined;
    if (useLocalDemo && demoAdminPassword && password === demoAdminPassword) {
      setAdminLoggedIn(true);
      setActivePanel('admin');
      return;
    }
    if (!supabase || !isSupabaseConfigured) {
      setAuthError('Falta la URL real del proyecto de Supabase para habilitar el acceso autenticado.');
      return;
    }
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) {
        setAuthError(error?.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error?.message ?? 'No se pudo iniciar sesión.');
        return;
      }
      const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      if (profileError || profile?.role !== 'admin') {
        await supabase.auth.signOut();
        setAuthError('Este usuario no tiene permisos de administrador.');
        return;
      }
      setAdminLoggedIn(true);
      setActivePanel('admin');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Error inesperado al iniciar sesión.');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setAdminLoggedIn(false);
    setMerchantLoggedIn(false);
    setAuthError('');
    setMerchantAuthError('');
    setDataError('');
    setCart({});
    setEditor(closedEditor);
    if (!useLocalDemo) {
      setBusinesses([]);
      setProducts([]);
      setPayments([]);
      setSelectedBusinessId('');
    }
    setActivePanel('home');
  };

  const goToPanel = (panel: Panel) => {
    setActivePanel(panel);
    setDataError('');
    if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0 });
  };

  /* ------------------------------ Efectos ------------------------------ */

  useEffect(() => {
    if (useLocalDemo) writeStorage(businessesStorageKey, businesses);
  }, [businesses]);

  useEffect(() => {
    if (useLocalDemo) writeStorage(productsStorageKey, products);
  }, [products]);

  useEffect(() => {
    const requestedSlug = getStoreSlugFromPath();
    if (!requestedSlug) return;
    const match = businesses.find((business) => business.slug === requestedSlug);
    if (match) {
      setSelectedBusinessId(match.id);
      setActivePanel('catalog');
    }
  }, [businesses]);

  useEffect(() => {
    // Cada tienda tiene su propio carrito: al cambiar de tienda se vacía.
    setCart({});
  }, [selectedBusinessId]);

  useEffect(() => {
    const onPopState = () => setActivePanel(getStoreSlugFromPath() ? 'catalog' : 'home');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !isSupabaseConfigured) return;
    let cancelled = false;

    const loadCatalogData = async () => {
      const storeSlug = getStoreSlugFromPath();
      const isPrivate = adminLoggedIn || merchantLoggedIn;
      // El correo del dueño solo se pide en paneles privados (nunca en la tienda pública).
      const columns = `id,owner_id,name,slug,whatsapp,status,created_at,activated_at,expires_at,initial_products_loaded,grace_days${isPrivate ? ',profiles(email)' : ''}`;
      let businessQuery = client.from('businesses').select(columns);
      if (adminLoggedIn) {
        businessQuery = businessQuery.order('created_at', { ascending: false });
      } else if (merchantLoggedIn) {
        const { data: userData, error: userError } = await client.auth.getUser();
        if (userError || !userData.user) {
          setDataError(userError?.message ?? 'La sesión del comerciante expiró. Vuelve a iniciar sesión.');
          return;
        }
        businessQuery = businessQuery.eq('owner_id', userData.user.id);
      } else if (storeSlug) {
        businessQuery = businessQuery.eq('slug', storeSlug).eq('status', 'activo');
      } else if (activePanel === 'catalog') {
        businessQuery = businessQuery.eq('status', 'activo').limit(1);
      } else {
        return;
      }

      const { data: remoteBusinesses, error: businessesError } = await businessQuery;
      if (cancelled) return;
      if (businessesError) {
        setDataError(businessesError.message);
        return;
      }
      type Row = {
        id: string; name: string; slug: string; whatsapp: string | null; status: string;
        created_at: string | null; activated_at: string | null; expires_at: string | null;
        initial_products_loaded: boolean; grace_days: number; profiles?: { email?: string } | { email?: string }[] | null;
      };
      const mappedBusinesses: Business[] = ((remoteBusinesses ?? []) as unknown as Row[]).map((business) => {
        const relation = business.profiles;
        const ownerEmail = Array.isArray(relation) ? relation[0]?.email ?? '' : relation?.email ?? '';
        return {
          id: business.id,
          name: business.name,
          slug: business.slug,
          whatsapp: business.whatsapp ?? '',
          status: fromDatabaseStatus(business.status),
          createdAt: business.created_at?.slice(0, 10) ?? '',
          activatedAt: business.activated_at?.slice(0, 10) ?? null,
          expiresAt: business.expires_at?.slice(0, 10) ?? '',
          ownerEmail,
          productsCount: 0,
          initialProductsLoaded: business.initial_products_loaded,
          graceDays: business.grace_days,
        };
      });

      if (mappedBusinesses.length === 0) {
        setBusinesses([]);
        setProducts([]);
        if (adminLoggedIn) {
          setSelectedBusinessId('');
          setBusinessForm({ name: '', slug: '', whatsapp: '', email: '', password: '' });
        } else if (merchantLoggedIn) {
          setMerchantLoggedIn(false);
          setMerchantAuthError('Esta cuenta no tiene una tienda asignada. Contacta al administrador.');
        } else {
          setRequestedStoreUnavailable(true);
          setActivePanel('catalog');
        }
        return;
      }

      const businessIds = mappedBusinesses.map((business) => business.id);
      let productsQuery = client
        .from('products')
        .select('id,business_id,category_id,name,description,price,is_active,image_url,created_at')
        .in('business_id', businessIds)
        .order('created_at', { ascending: false });
      // Los visitantes solo descargan productos visibles.
      if (!isPrivate) productsQuery = productsQuery.eq('is_active', true);

      const [categoriesResult, productsResult, paymentsResult] = await Promise.all([
        client.from('categories').select('id,business_id,name').in('business_id', businessIds),
        productsQuery,
        adminLoggedIn
          ? client.from('payments').select('id,business_id,amount,payment_date,period_covered,notes,kind').in('business_id', businessIds).order('payment_date', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (cancelled) return;
      if (categoriesResult.error || productsResult.error || paymentsResult.error) {
        setDataError(categoriesResult.error?.message ?? productsResult.error?.message ?? paymentsResult.error?.message ?? 'No se pudo cargar el catálogo.');
        return;
      }
      const categoryNames = new Map((categoriesResult.data ?? []).map((category) => [category.id, category.name as string]));
      const mappedProducts: Product[] = (productsResult.data ?? []).map((product) => ({
        id: product.id,
        businessId: product.business_id,
        name: product.name,
        category: categoryNames.get(product.category_id ?? '') ?? 'General',
        price: Number(product.price),
        description: product.description ?? '',
        active: product.is_active,
        image: product.image_url ?? '',
      }));
      if (adminLoggedIn && paymentsResult.data) {
        setPayments(
          (paymentsResult.data as Array<Record<string, unknown>>).map((payment) => ({
            id: String(payment.id),
            businessId: String(payment.business_id),
            amount: Number(payment.amount),
            date: String(payment.payment_date),
            period: String(payment.period_covered ?? ''),
            notes: String(payment.notes ?? ''),
            kind: payment.kind === 'inicial' ? 'Inicial' : 'Mensual',
          })),
        );
      }
      const withCounts = mappedBusinesses.map((business) => ({
        ...business,
        productsCount: mappedProducts.filter((product) => product.businessId === business.id).length,
      }));
      setBusinesses(withCounts);
      setProducts(mappedProducts);
      setRequestedStoreUnavailable(false);

      if (adminLoggedIn) {
        setSelectedBusinessId((currentId) => {
          if (businessIds.includes(currentId)) return currentId;
          const first = withCounts[0];
          setBusinessForm({ name: first.name, slug: first.slug, whatsapp: first.whatsapp, email: first.ownerEmail, password: '' });
          return first.id;
        });
      } else if (storeSlug) {
        const target = withCounts.find((business) => business.slug === storeSlug) ?? withCounts[0];
        setSelectedBusinessId(target.id);
        if (!merchantLoggedIn) setActivePanel('catalog');
      } else {
        setSelectedBusinessId(withCounts[0].id);
      }
      setDataError('');
    };

    void loadCatalogData().finally(() => {
      if (!cancelled) setStoreLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activePanel, adminLoggedIn, merchantLoggedIn]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const restoreSession = async () => {
      const { data } = await client.auth.getSession();
      if (!data.session) return;
      const onStorePage = Boolean(getStoreSlugFromPath());
      const { data: profile } = await client.from('profiles').select('role').eq('id', data.session.user.id).maybeSingle();
      if (profile?.role === 'admin') {
        setAdminLoggedIn(true);
        if (!onStorePage) setActivePanel('admin');
        return;
      }
      const { data: owned } = await client.from('businesses').select('id').eq('owner_id', data.session.user.id).limit(1);
      if (owned?.length) {
        setMerchantLoggedIn(true);
        if (!onStorePage) setActivePanel('merchant');
      }
    };
    void restoreSession();
  }, []);

  return {
    // estado
    activePanel,
    storeLoading,
    businesses,
    payments,
    selectedBusiness,
    selectedBusinessId,
    hasSelectedBusiness,
    businessProducts,
    businessCategories,
    publicProducts,
    cart,
    cartItems,
    cartCount,
    cartTotal,
    checkoutUrl,
    adminLoggedIn,
    merchantLoggedIn,
    authError,
    merchantAuthError,
    authLoading,
    dataError,
    requestedStoreUnavailable,
    creatingBusiness,
    adminMetrics,
    publicUrl,
    businessForm,
    editor,
    toasts,
    // acciones
    setDataError,
    setBusinessForm,
    goToPanel,
    updateCart,
    clearCart,
    addBusiness,
    selectBusinessForEdit,
    saveBusinessDetails,
    toggleBusinessStatus,
    savePayment,
    openNewProduct,
    openEditProduct,
    closeEditor,
    setEditorField,
    selectEditorImage,
    setEditorImageUrl,
    removeEditorImage,
    saveProduct,
    toggleProductStatus,
    duplicateProduct,
    removeProduct,
    loginMerchant,
    loginAdmin,
    logout,
    notify,
  };
}

export type CatalogApp = ReturnType<typeof useCatalogApp>;
