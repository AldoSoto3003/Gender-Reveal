import { useEffect } from 'react';
import type { Tema } from './types';

export const TEMAS: { valor: Tema; nombre: string; detalle: string; nina: string; nino: string; fondo: string }[] = [
  { valor: 'neutro', nombre: 'Miel y salvia', detalle: 'Amarillo para niña, verde para niño', nina: '#E3B23C', nino: '#9FB583', fondo: '#F2F0E3' },
  { valor: 'clasico', nombre: 'Rosa y azul', detalle: 'Los colores de siempre', nina: '#F2A9A0', nino: '#9DB6DB', fondo: '#F7F4EF' },
];

/** Tema del evento; si la base todavía no tiene la columna, se usa el neutro. */
export const temaDe = (e: { tema?: Tema | null } | null | undefined): Tema => (e?.tema === 'clasico' ? 'clasico' : 'neutro');

/** Pone el tema en <html data-tema> para que todos los tokens de color cambien a la vez. */
export function useTema(tema: Tema | null | undefined) {
  useEffect(() => {
    if (!tema) return;
    document.documentElement.dataset.tema = tema;
    const fondo = TEMAS.find((t) => t.valor === tema)?.fondo;
    if (fondo) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', fondo);
  }, [tema]);
}
