import type { Sexo } from './types';

/** Todo el evento se maneja en hora de Tijuana (Pacífico, con horario de verano). */
export const ZONA = 'America/Tijuana';

export function fechaLarga(iso: string): string {
  const f = new Date(iso);
  const dia = new Intl.DateTimeFormat('es-MX', { weekday: 'long', timeZone: ZONA }).format(f);
  const resto = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: ZONA }).format(f);
  return `${dia[0].toUpperCase()}${dia.slice(1)} ${resto}`;
}

export function fechaCorta(iso: string): string {
  const f = new Date(iso);
  const dia = new Intl.DateTimeFormat('es-MX', { weekday: 'long', timeZone: ZONA }).format(f);
  const resto = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: ZONA }).format(f);
  return `${dia} ${resto}`;
}

export function hora(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: ZONA })
    .format(new Date(iso))
    .replace(/\s?a\.?\s?m\.?/i, ' am')
    .replace(/\s?p\.?\s?m\.?/i, ' pm');
}

export function fechaHoraCorta(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: ZONA }).format(
    new Date(iso),
  );
}

/** Valores para <input type="date"> y <input type="time"> en hora de Tijuana. */
export function partesLocales(iso: string): { fecha: string; hora: string } {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '00';
  return { fecha: `${g('year')}-${g('month')}-${g('day')}`, hora: `${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}` };
}

/** Minutos que la zona del evento va adelante (+) o atrás (-) de UTC en ese instante. */
function desfase(ts: number): number {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(ts));
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return (Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - ts) / 60000;
}

/** Fecha y hora escritas en hora de Tijuana → instante ISO. Respeta el horario de verano. */
export function aIso(fecha: string, horaTxt: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const [h, mi] = horaTxt.split(':').map(Number);
  const local = Date.UTC(y, m - 1, d, h, mi);
  let ts = local - desfase(local) * 60000;
  ts = local - desfase(ts) * 60000; // segunda pasada por si cae justo en el cambio de horario
  return new Date(ts).toISOString();
}

export const palabra = (s: Sexo) => (s === 'nina' ? 'niña' : 'niño');
export const titulo = (s: Sexo) => (s === 'nina' ? '¡Es niña!' : '¡Es niño!');

/** "16 de enero" */
export function diaMes(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: ZONA }).format(new Date(iso));
}

/** Partes sueltas de la fecha para composiciones grandes: { dia: '16', mes: 'Enero', semana: 'Sábado', anio: '2027' } */
export function partesFecha(iso: string): { dia: string; mes: string; semana: string; anio: string } {
  const f = new Date(iso);
  const p = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-MX', { timeZone: ZONA, ...o }).format(f);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return { dia: p({ day: 'numeric' }), mes: cap(p({ month: 'long' })), semana: cap(p({ weekday: 'long' })), anio: p({ year: 'numeric' }) };
}

/** Inicio (00:00, hora de Tijuana) del día de una fecha. Igual que la regla de la base para abrir las fotos. */
export function inicioDelDia(iso: string): number {
  return Date.parse(aIso(partesLocales(iso).fecha, '00:00'));
}
