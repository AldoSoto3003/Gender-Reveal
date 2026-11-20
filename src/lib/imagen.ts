/**
 * Reduce una foto antes de subirla: lado mayor de 2000 px, JPEG al 82%.
 *
 * Siempre sube JPEG. Las HEIC del iPhone que el navegador no sabe leer (Chrome, Android,
 * Windows) se convierten primero con heic2any, que se descarga solo cuando hace falta.
 * Si aun así no se puede leer, lanza un error con instrucciones en lugar de subir un archivo
 * que después nadie podría ver.
 */
export async function reducirFoto(archivo: File, ladoMax = 2000, calidad = 0.82): Promise<Blob> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(archivo, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  } catch {
    if (!esHeic(archivo)) throw new Error(mensajeNoSeLee(archivo));
    try {
      bmp = await createImageBitmap(await deHeic(archivo));
    } catch {
      throw new Error(mensajeNoSeLee(archivo));
    }
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

const esHeic = (a: File) => /\.(heic|heif)$/i.test(a.name) || /heic|heif/i.test(a.type);

/** Convierte HEIC/HEIF a JPEG en el navegador. La librería (~1 MB) se carga solo aquí. */
async function deHeic(archivo: File): Promise<Blob> {
  const { default: heic2any } = await import('heic2any');
  const r = await heic2any({ blob: archivo, toType: 'image/jpeg', quality: 0.9 });
  return Array.isArray(r) ? r[0] : r;
}

function mensajeNoSeLee(archivo: File): string {
  return esHeic(archivo)
    ? `No pudimos convertir “${archivo.name}” (HEIC del iPhone). Súbela desde el iPhone o guárdala como JPG.`
    : `No pudimos leer “${archivo.name}”. Elige una foto JPG o PNG.`;
}
