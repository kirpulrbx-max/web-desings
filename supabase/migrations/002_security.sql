alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.service_jobs enable row level security;

create policy "Usuarios pueden ver su perfil" on public.profiles
for select using (auth.uid() = id);

create policy "Solo admin puede crear o actualizar negocios" on public.businesses
for all using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Comerciantes ven solo sus productos" on public.products
for select using (
  exists (
    select 1 from public.businesses b
    join public.profiles p on p.id = auth.uid()
    where b.id = products.business_id and b.owner_id = auth.uid()
  )
);

create policy "Los comerciantes administran su catálogo" on public.products
for all using (
  exists (
    select 1 from public.businesses b
    where b.id = products.business_id and b.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.businesses b
    where b.id = products.business_id and b.owner_id = auth.uid()
  )
);

create policy "Los clientes públicos pueden ver negocios activos" on public.businesses
for select using (status = 'activo');

create policy "Solo admin registra pagos" on public.payments
for all using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Los comerciantes pueden ver sus propias suscripciones" on public.subscriptions
for select using (
  exists (
    select 1 from public.businesses b
    where b.id = subscriptions.business_id and b.owner_id = auth.uid()
  )
);

create policy "Los comerciantes no pueden cambiar su propio rol" on public.profiles
for update using (auth.uid() = id)
with check (role = 'merchant');

create policy "No se permite asignar privilegios administrativos" on public.profiles
for insert with check (role = 'merchant');

create function public.is_admin() returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;
