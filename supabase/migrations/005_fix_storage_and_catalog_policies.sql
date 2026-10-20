-- Repara (de forma segura y repetible) los permisos necesarios para publicar productos con foto.
-- Corrige el error "new row violates row-level security policy" al añadir un producto.
-- Se puede ejecutar varias veces sin problema.

-- 1) Función auxiliar usada por las políticas del administrador.
create or replace function public.is_admin() returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- 2) Bucket público para las fotos de los productos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3) Permisos del bucket: todos ven las fotos; solo el administrador o el dueño
--    de la tienda (carpeta = id del negocio) pueden subir, cambiar o borrar.
drop policy if exists "Imágenes de catálogo visibles públicamente" on storage.objects;
create policy "Imágenes de catálogo visibles públicamente" on storage.objects
for select using (bucket_id = 'product-images');

drop policy if exists "Admin y dueño pueden subir imágenes de catálogo" on storage.objects;
create policy "Admin y dueño pueden subir imágenes de catálogo" on storage.objects
for insert to authenticated with check (
  bucket_id = 'product-images'
  and (
    public.is_admin()
    or exists (
      select 1 from public.businesses b
      where b.id::text = (storage.foldername(name))[1]
        and b.owner_id = auth.uid()
    )
  )
);

drop policy if exists "Admin y dueño pueden actualizar imágenes de catálogo" on storage.objects;
create policy "Admin y dueño pueden actualizar imágenes de catálogo" on storage.objects
for update to authenticated using (
  bucket_id = 'product-images'
  and (
    public.is_admin()
    or exists (
      select 1 from public.businesses b
      where b.id::text = (storage.foldername(name))[1]
        and b.owner_id = auth.uid()
    )
  )
) with check (
  bucket_id = 'product-images'
  and (
    public.is_admin()
    or exists (
      select 1 from public.businesses b
      where b.id::text = (storage.foldername(name))[1]
        and b.owner_id = auth.uid()
    )
  )
);

drop policy if exists "Admin y dueño pueden borrar imágenes de catálogo" on storage.objects;
create policy "Admin y dueño pueden borrar imágenes de catálogo" on storage.objects
for delete to authenticated using (
  bucket_id = 'product-images'
  and (
    public.is_admin()
    or exists (
      select 1 from public.businesses b
      where b.id::text = (storage.foldername(name))[1]
        and b.owner_id = auth.uid()
    )
  )
);

-- 4) Categorías y productos: el administrador gestiona todo; cada comerciante, lo de su tienda.
alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "Administra categorías de todas las tiendas" on public.categories;
create policy "Administra categorías de todas las tiendas" on public.categories
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Comerciante administra sus propias categorías" on public.categories;
create policy "Comerciante administra sus propias categorías" on public.categories
for all using (
  exists (select 1 from public.businesses b where b.id = categories.business_id and b.owner_id = auth.uid())
) with check (
  exists (select 1 from public.businesses b where b.id = categories.business_id and b.owner_id = auth.uid())
);

drop policy if exists "Clientes ven categorías de tiendas activas" on public.categories;
create policy "Clientes ven categorías de tiendas activas" on public.categories
for select using (
  exists (select 1 from public.businesses b where b.id = categories.business_id and b.status = 'activo')
);

drop policy if exists "Administra productos de todas las tiendas" on public.products;
create policy "Administra productos de todas las tiendas" on public.products
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Comerciante administra sus propios productos" on public.products;
create policy "Comerciante administra sus propios productos" on public.products
for all using (
  exists (select 1 from public.businesses b where b.id = products.business_id and b.owner_id = auth.uid())
) with check (
  exists (select 1 from public.businesses b where b.id = products.business_id and b.owner_id = auth.uid())
);

drop policy if exists "Clientes ven productos de tiendas activas" on public.products;
create policy "Clientes ven productos de tiendas activas" on public.products
for select using (
  exists (select 1 from public.businesses b where b.id = products.business_id and b.status = 'activo')
);

-- 5) El comerciante debe poder leer su propia tienda.
drop policy if exists "Comerciante ve su tienda" on public.businesses;
create policy "Comerciante ve su tienda" on public.businesses
for select using (owner_id = auth.uid());

-- DIAGNÓSTICO (opcional): para confirmar que la tienda pertenece al usuario con el que entras,
-- ejecuta esto cambiando el correo por el del comerciante. Las dos columnas de ids deben coincidir.
--
-- select b.id as negocio, b.name, b.owner_id, u.id as usuario_auth, (b.owner_id = u.id) as coincide
-- from public.businesses b
-- join public.profiles p on p.id = b.owner_id
-- left join auth.users u on u.email = p.email
-- where p.email = 'correo-del-comerciante@ejemplo.com';
