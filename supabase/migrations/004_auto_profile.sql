-- Crea automáticamente un perfil de comerciante cada vez que se registra un usuario en Supabase Auth.
-- El rol 'admin' nunca se asigna aquí: se concede solo manualmente desde el SQL Editor.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    'merchant'
  )
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Perfiles para usuarios que ya existían en Auth y todavía no tienen uno.
insert into public.profiles (id, email, role)
select u.id, u.email, 'merchant'
from auth.users u
where u.email is not null
  and not exists (select 1 from public.profiles p where p.id = u.id)
  and not exists (select 1 from public.profiles p where p.email = u.email);
