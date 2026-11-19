/**
 * Modo demo: misma API que Supabase, pero los datos viven en localStorage de este navegador.
 * Sirve para desarrollar y probar sin backend. Entre pestañas se sincroniza con BroadcastChannel,
 * así se puede probar la revelación en vivo con dos pestañas abiertas.
 */
import { deviceId, guardarLocal, leerLocal } from '../device';
import { reducirFoto } from '../imagen';
import type { Api, Asistencia, Evento, FotoHistoria, FotoRecuerdo, Prediccion, Respuesta, Sexo } from '../types';

type Tabla = 'eventos' | 'predicciones' | 'fotos_recuerdos';

interface Estado {
  evento: Evento;
  predicciones: (Prediccion & { device: string; peso_kg: number | null })[];
  asistencias: (Asistencia & { device: string })[];
  historia: FotoHistoria[];
  recuerdos: (FotoRecuerdo & { device: string })[];
  sello: { resultado: Sexo | null; token: string; pin: string; sellado_en: string | null };
}

const KEY = 'revelacion.demo.v1';
const ahora = () => new Date().toISOString();
const id = () => Math.random().toString(36).slice(2, 10);

function inicial(): Estado {
  const hace = (h: number) => new Date(Date.now() - h * 36e5).toISOString();
  const pred = (nombre: string, p: Sexo, h: number) => ({
    id: id(), nombre, prediccion: p, creado_en: hace(h), device: id(), peso_kg: null,
  });
  const asis = (nombre: string, respuesta: Respuesta, personas: number, mensaje: string, h: number) => ({
    id: id(), nombre, respuesta, personas, mensaje, creado_en: hace(h), actualizado_en: hace(h), device: id(),
  });
  return {
    evento: {
      id: 'demo',
      fecha_hora: '2027-01-16T22:00:00.000Z',
      lugar: '',
      direccion: '',
      nota: '',
      nombres_papas: '',
      telefono: '',
      estado: 'pendiente',
      resultado: null,
      revelado_en: null,
      galeria_visible: false,
      invitados_suben_fotos: true,
      es_prueba: true,
    },
    predicciones: [
      pred('Tía Lupita', 'nina', 50), pred('Abuela Tere', 'nino', 46), pred('Mariana', 'nina', 40),
      pred('Carlos', 'nino', 33), pred('Abuelo Rafa', 'nina', 30), pred('Ximena', 'nino', 22),
      pred('Sofía', 'nina', 18), pred('Tío Beto', 'nino', 10), pred('Paty', 'nina', 4),
    ],
    asistencias: [
      asis('Tía Lupita', 'si', 3, '¡No me lo pierdo por nada!', 50),
      asis('Abuela Tere', 'si', 2, 'Ahí estaremos con el abuelo.', 46),
      asis('Carlos Ruiz', 'si', 4, '', 33),
      asis('Ximena Paz', 'no', 0, 'Estaré de viaje, ¡mándenme fotos!', 22),
      asis('Memo Díaz', 'tal_vez', 2, 'Depende del trabajo, les aviso.', 12),
      asis('Paty Herrera', 'si', 3, 'Llevo el postre.', 4),
    ],
    historia: [
      { id: id(), url: '', ruta: '', titulo: 'Primera ecografía', tipo: 'ecografia', posicion: 0 },
      { id: id(), url: '', ruta: '', titulo: 'El día que nos enteramos', tipo: 'foto', posicion: 1 },
      { id: id(), url: '', ruta: '', titulo: 'La pancita, semana 16', tipo: 'foto', posicion: 2 },
      { id: id(), url: '', ruta: '', titulo: 'Segunda ecografía', tipo: 'ecografia', posicion: 3 },
      { id: id(), url: '', ruta: '', titulo: 'Preparando su cuarto', tipo: 'foto', posicion: 4 },
      { id: id(), url: '', ruta: '', titulo: 'Nosotros, esperándote', tipo: 'foto', posicion: 5 },
    ],
    recuerdos: [],
    sello: { resultado: null, token: 'demo', pin: '1234', sellado_en: null },
  };
}

function aDataUrl(b: Blob): Promise<string> {
  return new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => mal(r.error);
    r.readAsDataURL(b);
  });
}

async function fotoLigera(b: Blob): Promise<string> {
  // En demo se guardan en localStorage, así que van más chicas.
  const file = b instanceof File ? b : new File([b], 'foto.jpg', { type: b.type || 'image/jpeg' });
  return aDataUrl(await reducirFoto(file, 900, 0.72));
}

export function crearApiDemo(): Api {
  let s: Estado = leerLocal<Estado | null>(KEY, null) ?? inicial();
  const oyentes = new Set<(t: Tabla) => void>();
  const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('revelacion-demo') : null;

  canal?.addEventListener('message', (e: MessageEvent<Tabla>) => {
    s = leerLocal<Estado | null>(KEY, null) ?? s;
    oyentes.forEach((f) => f(e.data));
  });

  function guardar(t: Tabla | null) {
    try {
      guardarLocal(KEY, s);
    } catch {
      /* sin espacio */
    }
    if (t) {
      oyentes.forEach((f) => f(t));
      canal?.postMessage(t);
    }
  }

  const dev = () => deviceId();
  const espera = () => new Promise((r) => setTimeout(r, 180));
  const copia = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
  const limpiarRec = ({ device: _d, ...r }: FotoRecuerdo & { device: string }) => r;

  return {
    modo: 'demo',

    async evento() {
      return copia(s.evento);
    },
    async predicciones() {
      return s.predicciones.map(({ id: i, nombre, prediccion, creado_en }) => ({ id: i, nombre, prediccion, creado_en }));
    },
    async miPrediccion() {
      const p = s.predicciones.find((x) => x.device === dev());
      return p ? { nombre: p.nombre, prediccion: p.prediccion, peso_kg: p.peso_kg } : null;
    },
    async guardarPrediccion(nombre, prediccion, pesoKg) {
      await espera();
      if (s.evento.estado !== 'pendiente') throw new Error('Las predicciones ya están cerradas');
      const p = s.predicciones.find((x) => x.device === dev());
      if (p) Object.assign(p, { nombre: nombre.trim(), prediccion, peso_kg: pesoKg });
      else s.predicciones.push({ id: id(), nombre: nombre.trim(), prediccion, creado_en: ahora(), device: dev(), peso_kg: pesoKg });
      guardar('predicciones');
    },
    async borrarPrediccion() {
      s.predicciones = s.predicciones.filter((x) => x.device !== dev());
      guardar('predicciones');
    },
    async miAsistencia() {
      const a = s.asistencias.find((x) => x.device === dev());
      return a ? { nombre: a.nombre, respuesta: a.respuesta, personas: a.personas, mensaje: a.mensaje } : null;
    },
    async guardarAsistencia(a) {
      await espera();
      const fila = s.asistencias.find((x) => x.device === dev());
      const datos = {
        nombre: a.nombre.trim(),
        respuesta: a.respuesta,
        personas: a.respuesta === 'no' ? 0 : a.personas,
        mensaje: a.mensaje.trim(),
      };
      if (fila) Object.assign(fila, datos, { actualizado_en: ahora() });
      else s.asistencias.unshift({ id: id(), ...datos, creado_en: ahora(), actualizado_en: ahora(), device: dev() });
      guardar(null);
    },
    async fotosHistoria() {
      return copia([...s.historia].sort((a, b) => a.posicion - b.posicion));
    },
    async recuerdosPublicados() {
      return s.recuerdos.filter((r) => r.estado === 'publicada').map(limpiarRec);
    },
    async subirRecuerdo(archivo, nombre) {
      if (!s.evento.invitados_suben_fotos) throw new Error('Por ahora no se pueden subir fotos');
      const url = await fotoLigera(archivo);
      s.recuerdos.unshift({
        id: id(), url, ruta: '', bucket: 'recuerdos-pendientes', subida_por: nombre.trim(), estado: 'pendiente', creado_en: ahora(), device: dev(),
      });
      guardar('fotos_recuerdos');
    },
    escuchar(alCambiar) {
      oyentes.add(alCambiar);
      return () => oyentes.delete(alCambiar);
    },

    async sesion() {
      return { email: 'modo-demo@local', admin: true };
    },
    async entrar() {},
    async salir() {},
    alCambiarSesion() {
      return () => {};
    },
    async asistencias() {
      return s.asistencias.map(({ device: _d, ...a }) => a);
    },
    async actualizarEvento(cambios) {
      await espera();
      s.evento = { ...s.evento, ...cambios };
      guardar('eventos');
    },
    async subirFotoHistoria(archivo, titulo, tipo) {
      const url = await fotoLigera(archivo);
      s.historia.push({ id: id(), url, ruta: '', titulo, tipo, posicion: s.historia.length });
      guardar('eventos');
    },
    async editarFotoHistoria(fid, cambios) {
      s.historia = s.historia.map((f) => (f.id === fid ? { ...f, ...cambios } : f));
      guardar('eventos');
    },
    async ordenarFotosHistoria(ids) {
      s.historia = s.historia.map((f) => ({ ...f, posicion: ids.indexOf(f.id) }));
      guardar('eventos');
    },
    async borrarFotoHistoria(fid) {
      s.historia = s.historia.filter((f) => f.id !== fid);
      guardar('eventos');
    },
    async recuerdosTodos() {
      return s.recuerdos.filter((r) => r.estado !== 'quitada').map(limpiarRec);
    },
    async subirRecuerdoAdmin(archivo) {
      const url = await fotoLigera(archivo);
      s.recuerdos.unshift({
        id: id(), url, ruta: '', bucket: 'recuerdos', subida_por: 'Los papás', estado: 'publicada', creado_en: ahora(), device: '',
      });
      guardar('fotos_recuerdos');
    },
    async aprobarRecuerdo(foto) {
      s.recuerdos = s.recuerdos.map((r) => (r.id === foto.id ? { ...r, estado: 'publicada', bucket: 'recuerdos' } : r));
      guardar('fotos_recuerdos');
    },
    async quitarRecuerdo(foto) {
      s.recuerdos = s.recuerdos.map((r) => (r.id === foto.id ? { ...r, estado: 'quitada' } : r));
      guardar('fotos_recuerdos');
    },
    async estadoSello() {
      return { link_creado: true, sellado: s.sello.resultado !== null, sellado_en: s.sello.sellado_en };
    },
    async crearLinkGuardian() {
      return { token: s.sello.token, pin: s.sello.pin };
    },
    async revelar() {
      await espera();
      const r = s.sello.resultado;
      if (!r) throw new Error('El guardián todavía no sella el resultado. En modo demo, abre /guardian/demo con el PIN 1234.');
      s.evento = { ...s.evento, estado: 'revelado', resultado: r, revelado_en: ahora() };
      guardar('eventos');
      return r;
    },
    async reiniciarPrueba() {
      s.evento = { ...s.evento, estado: 'pendiente', resultado: null, revelado_en: null };
      guardar('eventos');
    },

    async guardianInfo(token) {
      if (token !== s.sello.token) return null;
      return { sellado: s.sello.resultado !== null, fecha_hora: s.evento.fecha_hora, revelado: s.evento.estado === 'revelado' };
    },
    async sellar(token, pin, resultado) {
      await espera();
      if (token !== s.sello.token) throw new Error('Link inválido');
      if (pin !== s.sello.pin) throw new Error('PIN incorrecto');
      if (s.evento.estado !== 'pendiente') throw new Error('El resultado ya se reveló');
      s.sello = { ...s.sello, resultado, sellado_en: ahora() };
      guardar(null);
    },
  };
}
