export type BusinessStatus = 'Activo' | 'Suspendido' | 'Vencido';

export type Business = {
  id: string;
  name: string;
  slug: string;
  whatsapp: string;
  status: BusinessStatus;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string;
  ownerEmail: string;
  merchantPasswordHash?: string;
  productsCount: number;
  initialProductsLoaded: boolean;
  graceDays: number;
};

export type Product = {
  id: string;
  businessId: string;
  name: string;
  category: string;
  price: number;
  description: string;
  active: boolean;
  image: string;
};

export type Payment = {
  id: string;
  businessId: string;
  amount: number;
  date: string;
  period: string;
  notes: string;
  kind: 'Inicial' | 'Mensual';
};

export const businesses: Business[] = [
  {
    id: 'biz-001',
    name: 'La Dulce Panadería',
    slug: 'la-dulce-panaderia',
    whatsapp: '+584141234567',
    status: 'Activo',
    createdAt: '2026-01-12',
    activatedAt: '2026-01-15',
    expiresAt: '2026-11-15',
    ownerEmail: 'admin@dulcepan.com',
    productsCount: 12,
    initialProductsLoaded: true,
    graceDays: 0,
  },
  {
    id: 'biz-002',
    name: 'Mundo de Abarrotes',
    slug: 'mundo-de-abarrotes',
    whatsapp: '+584162345678',
    status: 'Suspendido',
    createdAt: '2026-02-03',
    activatedAt: '2026-02-10',
    expiresAt: '2026-09-10',
    ownerEmail: 'ventas@abarrotesmv.com',
    productsCount: 8,
    initialProductsLoaded: false,
    graceDays: 7,
  },
  {
    id: 'biz-003',
    name: 'Bebé y Casa',
    slug: 'bebe-y-casa',
    whatsapp: '+584143456789',
    status: 'Vencido',
    createdAt: '2025-11-20',
    activatedAt: '2025-12-01',
    expiresAt: '2026-09-01',
    ownerEmail: 'hola@bebecasa.ve',
    productsCount: 19,
    initialProductsLoaded: true,
    graceDays: 3,
  },
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    businessId: 'biz-001',
    name: 'Pan de harina integral',
    category: 'Panadería',
    price: 5.5,
    description: 'Preparado con harina integral y levadura natural.',
    active: true,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'prod-2',
    businessId: 'biz-001',
    name: 'Caja de arepas',
    category: 'Panadería',
    price: 18,
    description: 'Paquete con 12 arepas tocino y queso.',
    active: true,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'prod-3',
    businessId: 'biz-001',
    name: 'Pastel de queso',
    category: 'Postres',
    price: 24,
    description: 'Clásico pastel de queso con base crocante.',
    active: true,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'prod-4',
    businessId: 'biz-002',
    name: 'Arroz premium 5 kg',
    category: 'Abarrotes',
    price: 29,
    description: 'Arroz de primera calidad para consumo diario.',
    active: true,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'prod-5',
    businessId: 'biz-002',
    name: 'Detergente familiar',
    category: 'Hogar',
    price: 14,
    description: 'Detergente de alta espuma para ropa diaria.',
    active: false,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'prod-6',
    businessId: 'biz-003',
    name: 'Set de sábanas',
    category: 'Hogar',
    price: 42,
    description: 'Juego de sábanas de algodón para cama doble.',
    active: true,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'prod-7',
    businessId: 'biz-003',
    name: 'Manta para bebé',
    category: 'Bebés',
    price: 32,
    description: 'Manta suave y ligera para la hora del descanso.',
    active: true,
    image: 'https://images.unsplash.com/photo-1516979187454-437ec8d0b8ea?auto=format&fit=crop&w=1200&q=80',
  },
];

export const payments: Payment[] = [
  {
    id: 'pay-1',
    businessId: 'biz-001',
    amount: 30,
    date: '2026-01-12',
    period: 'Creación',
    notes: 'Pago inicial registrado por administrador.',
    kind: 'Inicial',
  },
  {
    id: 'pay-2',
    businessId: 'biz-001',
    amount: 5,
    date: '2026-02-12',
    period: 'Febrero 2026',
    notes: 'Renovación mensual normal.',
    kind: 'Mensual',
  },
  {
    id: 'pay-3',
    businessId: 'biz-002',
    amount: 30,
    date: '2026-02-03',
    period: 'Creación',
    notes: 'Alta de negocio y carga inicial programada.',
    kind: 'Inicial',
  },
  {
    id: 'pay-4',
    businessId: 'biz-003',
    amount: 30,
    date: '2025-11-20',
    period: 'Creación',
    notes: 'Pago inicial recibido.',
    kind: 'Inicial',
  },
];
