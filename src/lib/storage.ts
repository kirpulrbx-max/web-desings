import type { SupabaseClient } from '@supabase/supabase-js';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

export async function uploadProductImage(client: SupabaseClient, businessId: string, file: File) {
  const path = `${businessId}/${crypto.randomUUID()}.jpg`;
  const { error } = await client.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg', cacheControl: '31536000' });
  if (error) throw error;
  return client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Devuelve la ruta dentro del bucket si la URL pertenece a nuestras fotos subidas. */
export const getStoragePathFromUrl = (url: string) => {
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  try {
    return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
  } catch {
    return null;
  }
};

/** Borra una foto subida que ya no se usa. Los fallos no bloquean al usuario. */
export async function deleteProductImage(client: SupabaseClient, url: string | undefined) {
  if (!url) return;
  const path = getStoragePathFromUrl(url);
  if (!path) return;
  await client.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]).catch(() => undefined);
}
