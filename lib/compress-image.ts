// nginx de producción acepta peticiones de hasta 1 MB (client_max_body_size
// por defecto). Cada imagen se sube sola y queda por debajo de este tamaño,
// con margen para el resto del formulario multipart.
export const UPLOAD_LIMIT_BYTES = 1024 * 1024 - 32 * 1024;

const MAX_DIMENSION = 2048;
// Se prueba en orden hasta que la imagen quede por debajo del límite
const JPEG_QUALITIES = [0.8, 0.7, 0.6, 0.5];
// Si ni con la menor calidad cabe, se achica y se vuelve a probar
const SHRINK_FACTOR = 0.7;
const MAX_SHRINKS = 4;

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  );
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo procesar la imagen'));
    };
    img.src = url;
  });
}

async function encode(
  img: HTMLImageElement,
  width: number,
  height: number
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);

  let blob: Blob | null = null;
  for (const quality of JPEG_QUALITIES) {
    blob = await canvasToJpeg(canvas, quality);
    if (!blob || blob.size <= UPLOAD_LIMIT_BYTES) break;
  }
  return blob;
}

/**
 * Convierte la imagen a JPEG por debajo de UPLOAD_LIMIT_BYTES. Las livianas
 * (que no son HEIC) se dejan tal cual. Falla si el navegador no puede leerla.
 */
export async function compressImage(file: File): Promise<File> {
  const isHeic = file.type.includes('heic') || file.type.includes('heif');
  if (file.size <= UPLOAD_LIMIT_BYTES && !isHeic) return file;

  const img = await loadImage(file);
  let { width, height } = img;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  let blob = await encode(img, width, height);
  for (
    let i = 0;
    i < MAX_SHRINKS && blob && blob.size > UPLOAD_LIMIT_BYTES;
    i++
  ) {
    width = Math.round(width * SHRINK_FACTOR);
    height = Math.round(height * SHRINK_FACTOR);
    blob = await encode(img, width, height);
  }

  // Si comprimir no la achica (y el navegador sí puede mostrar el
  // original), conservar el original
  if (!blob || (blob.size >= file.size && !isHeic)) return file;
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}
