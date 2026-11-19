import { fechaCorta, hora } from '../lib/formato';
import type { Evento } from '../lib/types';
import { AZUL, ROSA } from './SvgDefs';

/** Tamaño de letra para que una línea quepa en el ancho de la tarjeta. */
function talla(texto: string, base: number, ancho = 520): number {
  const estimado = texto.length * base * 0.56;
  return estimado > ancho ? Math.max(14, Math.floor((ancho / (texto.length * 0.56)) * 10) / 10) : base;
}

function Linea({ y, texto, base }: { y: number; texto: string; base: number }) {
  return (
    <text x={300} y={y} fontSize={talla(texto, base)}>
      {texto}
    </text>
  );
}

/** La tarjeta de la invitación (600 × 840) en papel de acuarela. */
export function Tarjeta({ evento, className }: { evento: Evento; className?: string }) {
  const papas = evento.nombres_papas.trim();
  const fecha = `${fechaCorta(evento.fecha_hora)}, ${hora(evento.fecha_hora)}`.toUpperCase();
  const lugar = (evento.lugar || 'Lugar por confirmar').toUpperCase();
  const direccion = evento.direccion.toUpperCase();
  const etiqueta = `¿Niña o niño? Acompáñanos a la revelación de género${papas ? ` de ${papas}` : ''}. ${fechaCorta(
    evento.fecha_hora,
  )} a las ${hora(evento.fecha_hora)}. ${evento.lugar} ${evento.direccion}`;

  return (
    <svg className={className} viewBox="0 0 600 840" role="img" aria-label={etiqueta}>
      <rect width={600} height={840} filter="url(#paperLit)" />
      <use href="#bal" x={200} y={-150} width={190} height={247} style={{ color: AZUL }} opacity={0.42} />
      <use href="#bal" x={468} y={-24} width={200} height={260} style={{ color: ROSA }} opacity={0.5} />
      <use href="#bal" x={-112} y={318} width={200} height={260} style={{ color: AZUL }} opacity={0.55} />
      <use href="#bal" x={502} y={372} width={170} height={221} style={{ color: ROSA }} opacity={0.48} />
      <path d="M170 322C150 420 204 520 132 640C92 708 72 780 62 840" fill="none" stroke="url(#goldLine)" strokeWidth={2.6} />
      <path d="M170 322C192 432 140 540 176 664C190 720 182 790 196 840" fill="none" stroke="url(#goldLine)" strokeWidth={1.4} />
      <path d="M435 448C456 540 398 622 470 722C500 772 520 810 538 840" fill="none" stroke="url(#goldLine)" strokeWidth={2.6} />
      <path d="M435 448C420 548 470 630 444 730C434 780 446 816 452 840" fill="none" stroke="url(#goldLine)" strokeWidth={1.4} />
      <use href="#bal" x={30} y={20} width={280} height={364} style={{ color: ROSA }} />
      <use href="#bal" x={300} y={152} width={270} height={351} style={{ color: AZUL }} />
      <g fontFamily="Patrick Hand, Comic Sans MS, cursive" textAnchor="middle">
        <g fill="#C0504A" fontSize={50} letterSpacing={3} transform="rotate(-4 168 175)">
          <text x={168} y={138}>¿NIÑA</text>
          <text x={168} y={186}>O</text>
          <text x={168} y={234}>NIÑO?</text>
        </g>
        <g fill="#34507A" fontSize={50} letterSpacing={3} transform="rotate(4 436 300)">
          <text x={436} y={286}>¿QUÉ</text>
          <text x={436} y={336}>SERÁ?</text>
        </g>
        <g fill="#4E5A6E" letterSpacing={3}>
          <Linea y={560} texto="ACOMPÁÑANOS A LA" base={23} />
          <Linea y={612} texto="REVELACIÓN DE GÉNERO" base={44} />
          {papas && <Linea y={652} texto={`DE ${papas.toUpperCase()}`} base={23} />}
          <Linea y={714} texto={fecha} base={22} />
          <Linea y={746} texto={lugar} base={22} />
          {direccion && <Linea y={778} texto={direccion} base={22} />}
        </g>
      </g>
    </svg>
  );
}
