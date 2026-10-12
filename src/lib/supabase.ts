import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const getSupabaseStatusMessage = () => {
  if (!supabaseUrl && supabaseAnonKey) {
    return 'La clave pública está lista; falta VITE_SUPABASE_URL del proyecto.';
  }

  if (!isSupabaseConfigured) {
    return 'Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.';
  }

  return 'Supabase listo para autenticación y almacenamiento de datos.';
};
