import { useEffect } from 'react';
import type { Colores, Tema } from './types';

export const PALETA_NEUTRO: Colores = { nina: '#E3B23C', nino: '#9FB583', tinta: '#2C3624', papel: '#F2F0E3' };
export const PALETA_CLASICO: Colores = { nina: '#F2A9A0', nino: '#9DB6DB', tinta: '#3B4558', papel: '#F7F4EF' };

export const TEMAS: { valor: Exclude<Tema, 'personal'>; nombre: string; detalle: string; colores: Colores }[] = [
  { valor: 'neutro', nombre: 'Miel y salvia', detalle: 'Amarillo para niña, verde para niño', colores: PALETA_NEUTRO },
  { valor: 'clasico', nombre: 'Rosa y azul', detalle: 'Los colores de siempre', colores: PALETA_CLASICO },
];

/** Puntos de partida para armar una paleta propia. */
export const PRESETS: { nombre: string; colores: Colores }[] = [
  { nombre: 'Miel y salvia', colores: PALETA_NEUTRO },
  { nombre: 'Rosa y azul', colores: PALETA_CLASICO },
  { nombre: 'Lavanda y menta', colores: { nina: '#C3A6E0', nino: '#8FD3C1', tinta: '#3A3550', papel: '#F6F4F8' } },
  { nombre: 'Durazno y aqua', colores: { nina: '#F5B48C', nino: '#7FC8C8', tinta: '#2F4447', papel: '#FBF6F0' } },
  { nombre: 'Terracota y oliva', colores: { nina: '#D98A6A', nino: '#8E9B5B', tinta: '#3B3428', papel: '#F5EFE6' } },
  { nombre: 'Lila y cielo', colores: { nina: '#D9A7C7', nino: '#A7C7E7', tinta: '#3C4157', papel: '#F8F6FA' } },
  { nombre: 'Coral y pino', colores: { nina: '#F08A7E', nino: '#5E8C74', tinta: '#26332D', papel: '#F4F1EA' } },
];

export const esHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

/** Tema del evento; si la base todavía no tiene la columna, se usa el neutro. */
export const temaDe = (e: { tema?: Tema | null; colores?: Colores | null } | null | undefined): Tema =>
  e?.tema === 'clasico' ? 'clasico' : e?.tema === 'personal' && e.colores ? 'personal' : 'neutro';

/** Los 4 colores base efectivos de un evento. */
export function coloresDe(e: { tema?: Tema | null; colores?: Colores | null } | null | undefined): Colores {
  const t = temaDe(e);
  return t === 'personal' && e?.colores ? e.colores : t === 'clasico' ? PALETA_CLASICO : PALETA_NEUTRO;
}

const VARS: Record<keyof Colores, string> = { nina: '--globo-nina', nino: '--globo-nino', tinta: '--tinta', papel: '--papel' };

/**
 * Pone el tema en <html data-tema>. Para la paleta personal, además escribe los 4 colores base
 * como variables CSS; base.css deriva de ellos todos los demás tonos.
 */
export function aplicarTema(tema: Tema, colores?: Colores | null) {
  const raiz = document.documentElement;
  raiz.dataset.tema = tema;
  for (const [k, v] of Object.entries(VARS)) {
    if (tema === 'personal' && colores) raiz.style.setProperty(v, colores[k as keyof Colores]);
    else raiz.style.removeProperty(v);
  }
  const fondo = tema === 'personal' && colores ? colores.papel : (tema === 'clasico' ? PALETA_CLASICO : PALETA_NEUTRO).papel;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', fondo);
}

export function useTema(e: { tema?: Tema | null; colores?: Colores | null } | null | undefined) {
  const tema = e ? temaDe(e) : null;
  const clave = e?.colores ? JSON.stringify(e.colores) : '';
  useEffect(() => {
    if (!tema) return;
    aplicarTema(tema, tema === 'personal' ? (JSON.parse(clave) as Colores) : null);
  }, [tema, clave]);
}

/** Contraste WCAG entre dos colores hex (1 a 21). */
export function contraste(a: string, b: string): number {
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
