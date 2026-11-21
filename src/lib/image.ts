/**
 * Prepara las fotos que vienen de la fototeca o la cámara del celular.
 *
 * Las fotos de un teléfono suelen pesar 3–12 MB y a veces llegan como HEIC (iPhone).
 * Aquí se decodifican en el navegador, se corrige la orientación, se reducen a un
 * tamaño adecuado para catálogo y se convierten a JPEG, que es lo que acepta el bucket.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

export type PreparedImage = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
};

const isHeic = (file: File) => /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode'));
    };
    image.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode'))), 'image/jpeg', quality);
  });

export async function prepareProductImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/') && !isHeic(file)) {
    throw new Error('El archivo seleccionado no es una imagen.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('La foto es demasiado grande (más de 25 MB). Elige otra o tómala con menor resolución.');
  }

  let image: HTMLImageElement;
  try {
    // Los navegadores modernos aplican la orientación EXIF al decodificar.
    image = await loadImage(file);
  } catch {
    throw new Error(
      isHeic(file)
        ? 'Este navegador no puede abrir fotos HEIC. En el iPhone ve a Ajustes › Cámara › Formatos y elige "Más compatible", o comparte la foto como JPG.'
        : 'No se pudo abrir la imagen. Prueba con otra foto.',
    );
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Tu navegador no permite procesar imágenes.');
  // Fondo blanco para PNG con transparencia (JPEG no tiene canal alfa).
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  let blob = await canvasToBlob(canvas, JPEG_QUALITY);
  if (blob.size > MAX_OUTPUT_BYTES) blob = await canvasToBlob(canvas, 0.6);
  if (blob.size > MAX_OUTPUT_BYTES) throw new Error('No se pudo reducir la foto por debajo de 5 MB.');

  const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]+/g, '-').slice(0, 40) || 'foto';
  const output = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  return { file: output, previewUrl: URL.createObjectURL(output), width, height };
}

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('No se pudo leer la imagen.')));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });

export const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
