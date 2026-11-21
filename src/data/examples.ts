import type { Business, Product } from './mock';

/**
 * Tiendas de ejemplo para mostrar a clientes potenciales cómo puede verse su catálogo.
 * Viven en el código (no en Supabase), así que funcionan siempre en /ejemplo/<slug>.
 * Las fotos son ilustraciones SVG generadas aquí: no dependen de bancos de imágenes.
 */

export type StoreTheme = {
  /** Color principal (botones, cabecera). */
  primary: string;
  /** Tono oscuro del principal (degradado de la cabecera, hover). */
  primaryDark: string;
  /** Fondo suave del principal (insignias). */
  primarySoft: string;
  /** Texto claro sobre la cabecera. */
  onPrimaryMuted: string;
  /** Fondo general de la página. */
  background: string;
  /** Tipografía de títulos. */
  headingFont?: string;
  tagline: string;
};

export type ExampleStore = {
  business: Business;
  products: Product[];
  theme: StoreTheme;
  summary: string;
  emoji: string;
};

const art = (emoji: string, from: string, to: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient><radialGradient id="l" cx="0.3" cy="0.25" r="0.8"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="400" height="400" fill="url(#g)"/><rect width="400" height="400" fill="url(#l)"/><circle cx="330" cy="70" r="46" fill="#fff" fill-opacity="0.18"/><circle cx="60" cy="350" r="70" fill="#fff" fill-opacity="0.12"/><ellipse cx="200" cy="300" rx="110" ry="18" fill="#000" fill-opacity="0.10"/><text x="200" y="250" font-size="170" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const business = (id: string, name: string, slug: string): Business => ({
  id,
  name,
  slug,
  whatsapp: '',
  status: 'Activo',
  createdAt: '2026-11-01',
  activatedAt: '2026-11-01',
  expiresAt: '2099-12-31',
  ownerEmail: '',
  productsCount: 0,
  initialProductsLoaded: true,
  graceDays: 0,
});

type Item = [name: string, category: string, price: number, description: string, emoji: string, from: string, to: string];

const products = (businessId: string, items: Item[]): Product[] =>
  items.map(([name, category, price, description, emoji, from, to], index) => ({
    id: `${businessId}-${index + 1}`,
    businessId,
    name,
    category,
    price,
    description,
    active: true,
    image: art(emoji, from, to),
  }));

/* ---------------------------- Comida rápida ---------------------------- */

const fastFoodId = 'ejemplo-comida-rapida';
const fastFood: ExampleStore = {
  emoji: '🍔',
  summary: 'Hamburguesas, perros calientes y combos con colores intensos que abren el apetito.',
  theme: {
    primary: '#e23d28',
    primaryDark: '#b3261a',
    primarySoft: '#fff1ec',
    onPrimaryMuted: '#ffe1d6',
    background: '#fff8f3',
    headingFont: "'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif",
    tagline: 'Delivery y pick-up · Pide por WhatsApp',
  },
  business: business(fastFoodId, 'Brasa Burger', 'comida-rapida'),
  products: products(fastFoodId, [
    ['Burger Clásica', 'Hamburguesas', 6.5, 'Carne 150 g, queso amarillo, lechuga, tomate y salsas de la casa.', '🍔', '#ffb347', '#ff7a45'],
    ['Burger Doble Tocineta', 'Hamburguesas', 9, 'Doble carne, doble queso, tocineta crujiente y cebolla caramelizada.', '🍔', '#ff9a5a', '#e23d28'],
    ['Perro Caliente Especial', 'Perros', 3.5, 'Salchicha, papitas, repollo, queso rallado y salsas.', '🌭', '#ffd166', '#ff9f43'],
    ['Combo Familiar', 'Combos', 22, '4 hamburguesas clásicas, 2 papas grandes y refresco de 2 L.', '🍟', '#ffe08a', '#ffb347'],
    ['Papas Fritas Grandes', 'Acompañantes', 3, 'Papas crujientes con sal y salsa a elección.', '🍟', '#fff1a8', '#ffc94d'],
    ['Tequeños (12 und)', 'Acompañantes', 5, 'Tequeños de queso blanco con salsa de ajo.', '🧀', '#fff3c4', '#ffd166'],
    ['Pizza Personal', 'Pizzas', 5.5, 'Masa artesanal, salsa de tomate, mozzarella y jamón.', '🍕', '#ffc6a5', '#ff7a45'],
    ['Refresco 1,5 L', 'Bebidas', 2.5, 'Sabor a elección, bien frío.', '🥤', '#ffb3a7', '#e23d28'],
    ['Malteada de Chocolate', 'Bebidas', 4, 'Helado de chocolate, leche y crema batida.', '🥤', '#d9b38c', '#8b5a3c'],
  ]),
};

/* -------------------------------- Kiosco ------------------------------- */

const kioskId = 'ejemplo-kiosco';
const kiosk: ExampleStore = {
  emoji: '🏪',
  summary: 'Chucherías, bebidas, recargas y lo del día a día. Alegre, rápido y fácil de leer.',
  theme: {
    primary: '#1d5fd6',
    primaryDark: '#1747a6',
    primarySoft: '#eaf1ff',
    onPrimaryMuted: '#d6e4ff',
    background: '#f6f8fc',
    headingFont: "'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif",
    tagline: 'Abierto todos los días · Te lo llevamos',
  },
  business: business(kioskId, 'Kiosco La Esquina', 'kiosco'),
  products: products(kioskId, [
    ['Galletas de chocolate', 'Chucherías', 1.2, 'Paquete individual.', '🍪', '#ffe0b2', '#d7a26c'],
    ['Chupetas (x10)', 'Chucherías', 1, 'Sabores surtidos.', '🍭', '#ffd6ec', '#ff7ab8'],
    ['Chocolate en barra', 'Chucherías', 1.5, 'Chocolate con leche 40 g.', '🍫', '#e6c3a5', '#8b5a3c'],
    ['Agua mineral 600 ml', 'Bebidas', 0.8, 'Botella fría.', '💧', '#cfe8ff', '#6fb1ff'],
    ['Jugo de naranja 1 L', 'Bebidas', 2, 'Jugo pasteurizado.', '🧃', '#ffe7a3', '#ffb347'],
    ['Café para llevar', 'Bebidas', 1, 'Guayoyo o con leche.', '☕', '#e9d5c0', '#a0714f'],
    ['Pan campesino', 'Despensa', 1.5, 'Recién llegado.', '🍞', '#ffe8c2', '#e0a85a'],
    ['Cartón de huevos (30)', 'Despensa', 6, 'Huevos frescos.', '🥚', '#fff6e0', '#f3d29b'],
    ['Pilas AA (x2)', 'Varios', 2.5, 'Alcalinas.', '🔋', '#d6f5d6', '#4cc36a'],
    ['Recarga telefónica', 'Varios', 1, 'Movistar, Digitel o Movilnet. Indica tu número.', '📱', '#e0e7ff', '#1d5fd6'],
  ]),
};

/* -------------------------------- Joyería ------------------------------ */

const jewelryId = 'ejemplo-joyeria';
const jewelry: ExampleStore = {
  emoji: '💍',
  summary: 'Elegante y sobria: tonos dorados, tipografía con serifa y mucho espacio.',
  theme: {
    primary: '#9a7b3c',
    primaryDark: '#3b2f1e',
    primarySoft: '#f7f0e1',
    onPrimaryMuted: '#eadcbc',
    background: '#fbf8f2',
    headingFont: "'Playfair Display', Georgia, serif",
    tagline: 'Piezas en oro y plata · Envíos asegurados',
  },
  business: business(jewelryId, 'Aurea Joyería', 'joyeria'),
  products: products(jewelryId, [
    ['Anillo Solitario', 'Anillos', 180, 'Oro 18k con circón central de 6 mm. Incluye estuche.', '💍', '#f6ecd6', '#d8b874'],
    ['Alianzas de Matrimonio', 'Anillos', 320, 'Par de aros en oro 18k, acabado pulido. Grabado gratis.', '💍', '#efe2c4', '#b89552'],
    ['Collar Punto de Luz', 'Collares', 95, 'Cadena de plata 925 con piedra facetada.', '💎', '#eef2f7', '#b7c4d6'],
    ['Cadena Cartier 50 cm', 'Collares', 140, 'Oro 10k, cierre de seguridad.', '📿', '#f6ecd6', '#c9a55c'],
    ['Zarcillos de Perla', 'Zarcillos', 60, 'Perla cultivada 8 mm sobre plata 925.', '🦪', '#fbf7f0', '#e6d8c2'],
    ['Pulsera Tennis', 'Pulseras', 120, 'Plata 925 con circones engastados.', '💎', '#f1f3f6', '#a9b6c8'],
    ['Reloj Clásico Dorado', 'Relojes', 210, 'Caja de acero dorado, correa de cuero.', '⌚', '#f3e6c9', '#a8843f'],
    ['Dije Corazón', 'Dijes', 45, 'Oro 10k. Ideal para regalo.', '💛', '#fff4d6', '#e2b84a'],
  ]),
};

/* ---------------------------- Muestra genérica ------------------------- */

const sampleId = 'ejemplo-muestra';
const sample: ExampleStore = {
  emoji: '🛍️',
  summary: 'Plantilla neutra con productos de muestra para cualquier tipo de negocio.',
  theme: {
    primary: '#5b4bdb',
    primaryDark: '#3f32b0',
    primarySoft: '#efedff',
    onPrimaryMuted: '#dcd7ff',
    background: '#f7f7fb',
    tagline: 'Tu eslogan aquí · Pedidos por WhatsApp',
  },
  business: business(sampleId, 'Tu Tienda', 'muestra'),
  products: products(sampleId, [
    ['Producto A', 'Categoría 1', 10, 'Descripción breve del producto: qué es, tamaño o presentación.', '📦', '#e4e1ff', '#9d92ff'],
    ['Producto B', 'Categoría 1', 15, 'Puedes poner ingredientes, materiales o medidas.', '🎁', '#ffe1ef', '#ff8cc0'],
    ['Producto C', 'Categoría 1', 7.5, 'Los precios aceptan decimales.', '🧺', '#fff0cf', '#ffc65c'],
    ['Producto D', 'Categoría 2', 25, 'Cada producto puede tener su propia foto.', '🛍️', '#d9f5ec', '#4fc79e'],
    ['Producto E', 'Categoría 2', 12, 'Puedes ocultar productos agotados sin borrarlos.', '🏷️', '#dff0ff', '#64a8ff'],
    ['Producto F', 'Categoría 3', 5, 'Los clientes buscan por nombre o descripción.', '✨', '#f2e6ff', '#b783ff'],
    ['Producto G', 'Categoría 3', 40, 'Las categorías se crean al escribirlas.', '⭐', '#fff6cc', '#ffd23f'],
    ['Producto H', 'Categoría 3', 3, 'El pedido llega a tu WhatsApp con el total.', '🧾', '#eceff3', '#a7b0bd'],
  ]),
};

export const exampleStores: ExampleStore[] = [fastFood, kiosk, jewelry, sample];

export const findExampleStore = (slug: string) => exampleStores.find((store) => store.business.slug === slug) ?? null;

export const isExampleBusiness = (businessId: string) => businessId.startsWith('ejemplo-');

export const getExampleSlugFromPath = () => {
  if (typeof window === 'undefined') return '';
  const match = window.location.pathname.match(/^\/ejemplo\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : '';
};

export const getExampleTheme = (businessId: string) => exampleStores.find((store) => store.business.id === businessId)?.theme ?? null;
