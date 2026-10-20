// Edge Function: create-merchant
// Crea, en un solo paso y desde el servidor, el usuario del comerciante (Supabase Auth),
// su perfil y su negocio. Solo puede ejecutarla un usuario con rol 'admin'.
// La clave service_role vive únicamente aquí (variable de entorno del servidor) y nunca llega al navegador.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: 'La función no está configurada correctamente en el servidor.' }, 500);
  }

  // 1) Verificar quién llama y que sea administrador.
  const authHeader = request.headers.get('Authorization') ?? '';
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user) return json({ error: 'Sesión no válida. Inicia sesión de nuevo.' }, 401);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', callerData.user.id)
    .maybeSingle();
  if (callerProfile?.role !== 'admin') return json({ error: 'Solo el administrador puede crear negocios.' }, 403);

  // 2) Validar los datos recibidos.
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Datos no válidos.' }, 400);
  }
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const whatsapp = String(body.whatsapp ?? '').trim();
  const slug = slugify(String(body.slug ?? '').trim() || name);

  if (!name) return json({ error: 'Escribe el nombre del negocio.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'El correo no es válido.' }, 400);
  if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
  if (!slug) return json({ error: 'El enlace (slug) no es válido.' }, 400);

  const { data: slugTaken } = await admin.from('businesses').select('id').eq('slug', slug).maybeSingle();
  if (slugTaken) return json({ error: `El enlace "${slug}" ya está en uso. Elige otro.` }, 409);

  // 3) Crear el usuario en Supabase Auth (correo ya confirmado, para que pueda entrar de inmediato).
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    const alreadyExists = createError?.code === 'email_exists' || /already|registered/i.test(createError?.message ?? '');
    return json(
      { error: alreadyExists ? 'Ya existe una cuenta con ese correo.' : (createError?.message ?? 'No se pudo crear el usuario.') },
      alreadyExists ? 409 : 400,
    );
  }
  const ownerId = created.user.id;

  // 4) Asegurar el perfil de comerciante (el trigger normalmente ya lo creó).
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: ownerId, email, role: 'merchant' }, { onConflict: 'id' });
  if (profileError) {
    await admin.auth.admin.deleteUser(ownerId);
    return json({ error: `No se pudo crear el perfil: ${profileError.message}` }, 400);
  }

  // 5) Crear el negocio activo por 30 días.
  const today = new Date();
  const expires = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const { data: business, error: businessError } = await admin
    .from('businesses')
    .insert({
      owner_id: ownerId,
      name,
      slug,
      whatsapp,
      status: 'activo',
      activated_at: isoDate(today),
      expires_at: isoDate(expires),
    })
    .select('id, name, slug, whatsapp, status, created_at, activated_at, expires_at, initial_products_loaded, grace_days')
    .single();

  if (businessError || !business) {
    // Deshacer todo para no dejar usuarios huérfanos.
    await admin.from('profiles').delete().eq('id', ownerId);
    await admin.auth.admin.deleteUser(ownerId);
    return json({ error: `No se pudo crear el negocio: ${businessError?.message ?? 'error desconocido'}` }, 400);
  }

  return json({ business: { ...business, owner_email: email } }, 201);
});
