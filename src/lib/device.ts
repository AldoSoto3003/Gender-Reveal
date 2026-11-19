const KEY = 'revelacion.device';

function nuevoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Respaldo para navegadores viejos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let enMemoria: string | null = null;

/** Identificador anónimo de este navegador. Permite cambiar la predicción o la confirmación. */
export function deviceId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = nuevoId();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    enMemoria ??= nuevoId();
    return enMemoria;
  }
}

export function leerLocal<T>(clave: string, porDefecto: T): T {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

export function guardarLocal(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* almacenamiento bloqueado: se ignora */
  }
}
