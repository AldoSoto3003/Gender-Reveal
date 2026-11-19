/**
 * Reduce una foto antes de subirla: lado mayor de 2000 px, JPEG al 82%.
 * Las fotos HEIC del iPhone normalmente llegan ya como JPEG desde el selector de Safari;
 * si el navegador no puede decodificarla, se sube el archivo original.
 */
export async function reducirFoto(archivo: File, ladoMax = 2000, calidad = 0.82): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(archivo, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    const escala = Math.min(1, ladoMax / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * escala);
    const h = Math.round(bmp.height * escala);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return archivo;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', calidad));
    return blob ?? archivo;
  } catch {
    return archivo;
  }
}
