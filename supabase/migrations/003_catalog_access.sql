drop policy if exists "Admin puede ver perfiles de comerciantes" on public.profiles;
create policy "Admin puede ver perfiles de comerciantes" on public.profiles
for select using (public.is_admin());

drop policy if exists "Administra productos de todas las tiendas" on public.products;
create policy "Administra productos de todas las tiendas" on public.products
for all using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Clientes ven productos de tiendas activas" on public.products;
create policy "Clientes ven productos de tiendas activas" on public.products
for select using (
  exists (
    select 1
    from public.businesses b
    where b.id = products.business_id
      and b.status = 'activo'
  )
);

drop policy if exists "Administra categorías de todas las tiendas" on public.categories;
create policy "Administra categorías de todas las tiendas" on public.categories
for all using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Clientes ven categorías de tiendas activas" on public.categories;
create policy "Clientes ven categorías de tiendas activas" on public.categories
for select using (
  exists (
    select 1
    from public.businesses b
    where b.id = categories.business_id
      and b.status = 'activo'
  )
);
