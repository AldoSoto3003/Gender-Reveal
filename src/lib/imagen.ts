/**
 * Reduce una foto antes de subirla: lado mayor de 2000 px, JPEG al 82%.
 *
 * Siempre sube JPEG. Si el navegador no puede leer la foto (por ejemplo una HEIC del iPhone
 * abierta en Chrome de computadora), lanza un error con instrucciones en lugar de subir un
 * archivo que después nadie podría ver. En el iPhone, Safari y Chrome ya entregan JPEG.
 */
export async function reducirFoto(archivo: File, ladoMax = 2000, calidad = 0.82): Promise<Blob> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(archivo, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  } catch {
    throw new Error(mensajeNoSeLee(archivo));
  }
  const escala = Math.min(1, ladoMax / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * escala);
  const h = Math.round(bmp.height * escala);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(mensajeNoSeLee(archivo));
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', calidad));
  if (!blob) throw new Error(mensajeNoSeLee(archivo));
  return blob;
}

function mensajeNoSeLee(archivo: File): string {
  const heic = /\.(heic|heif)$/i.test(archivo.name) || /heic|heif/i.test(archivo.type);
  return heic
    ? `“${archivo.name}” está en formato HEIC del iPhone y este navegador no puede leerlo. Súbela desde el iPhone, desde Safari, o guárdala como JPG.`
    : `No pudimos leer “${archivo.name}”. Elige una foto JPG o PNG.`;
}
