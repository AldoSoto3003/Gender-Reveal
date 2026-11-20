// Genera vistas previas del correo de aviso: npx tsx scripts/vista-correo.ts <carpeta>
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { armarCorreo } from '../supabase/functions/avisar-asistencia/plantilla';

const dir = process.argv[2] ?? '.';
const t = { si: 24, tal: 3, no: 2 };
const panel = 'https://revelacion.aldosoto.dev/panel';
const ejemplos = {
  'correo-si': armarCorreo(
    { nombre: 'Tía Lupita', respuesta: 'si', personas: 3, adultos: 1, ninos: 1, acompanantes: 'Jorge y Emilia', mensaje: '¡No me lo pierdo por nada!' },
    null, t, 'neutro', panel,
  ),
  'correo-cambio-clasico': armarCorreo(
    { nombre: 'Memo Díaz', respuesta: 'no', personas: 0, adultos: 0, ninos: 0, acompanantes: '', mensaje: 'Me salió trabajo, mándenme fotos.' },
    'tal_vez', t, 'clasico', panel,
  ),
};
for (const [n, c] of Object.entries(ejemplos)) {
  writeFileSync(join(dir, `${n}.html`), c.html);
  console.log(n, '→', c.asunto);
}
