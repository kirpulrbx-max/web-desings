create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text not null default 'merchant' check (role in ('admin', 'merchant')),
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null unique,
  whatsapp text,
  status text not null default 'activo' check (status in ('activo', 'suspendido', 'vencido')),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  expires_at timestamptz,
  initial_products_loaded boolean not null default false,
  grace_days integer not null default 0,
  payment_plan_amount numeric(10,2) not null default 30,
  monthly_amount numeric(10,2) not null default 5
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.categories(id),
  name text not null,
  description text,
  price numeric(10,2) not null,
  is_active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  amount numeric(10,2) not null,
  payment_date date not null,
  period_covered text,
  notes text,
  kind text not null check (kind in ('inicial', 'mensual')),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'activo' check (status in ('activo', 'suspendido', 'vencido')),
  renewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.service_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  description text,
  cost numeric(10,2) not null default 0,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_proceso', 'finalizado')),
  created_at timestamptz not null default now()
);

create index if not exists idx_businesses_slug on public.businesses(slug);
create index if not exists idx_businesses_status on public.businesses(status);
create index if not exists idx_products_business_id on public.products(business_id);
create index if not exists idx_payments_business_id on public.payments(business_id);
create index if not exists idx_subscriptions_business_id on public.subscriptions(business_id);
