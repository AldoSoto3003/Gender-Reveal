import { fechaCorta, hora, partesFecha } from '../lib/formato';
import type { Evento } from '../lib/types';
import { NINA, NINO, TINTA_NINA, TINTA_NINO } from './SvgDefs';

/** Tamaño de letra para que una línea quepa en el ancho dado. */
function talla(texto: string, base: number, ancho: number, factor = 0.58): number {
  const estimado = texto.length * base * factor;
  return estimado > ancho ? Math.max(11, Math.floor((ancho / (texto.length * factor)) * 10) / 10) : base;
}

const DISPLAY = "'Bricolage Grotesque', 'Avenir Next', 'Segoe UI', sans-serif";
const SANS = "'Figtree', 'Segoe UI', Helvetica, Arial, sans-serif";
const ORO = 'var(--oro)';
const TINTA = { fill: 'var(--tinta)' };
const SUAVE = { fill: 'var(--texto-suave)' };

/**
 * La tarjeta de la invitación (600 × 840) para mandar por WhatsApp o imprimir.
 * Papelería sobria: mucho aire, filetes dorados finos, dos globos pequeños y la fecha al centro.
 * Los colores salen del tema elegido en el panel.
 */
export function Tarjeta({ evento, className }: { evento: Evento; className?: string }) {
  const papas = evento.nombres_papas.trim();
  const f = partesFecha(evento.fecha_hora);
  const lugar = evento.lugar.trim() || 'Lugar por confirmar';
  const direccion = evento.direccion.trim();
  const etiqueta = `¿Niña o niño? Acompáñanos a la revelación de género${papas ? ` de ${papas}` : ''}. ${fechaCorta(
    evento.fecha_hora,
  )} a las ${hora(evento.fecha_hora)}. ${lugar}${direccion ? `, ${direccion}` : ''}.`;

  return (
    <svg className={className} viewBox="0 0 600 840" role="img" aria-label={etiqueta}>
      {/* papel */}
      <rect width={600} height={840} style={{ fill: 'var(--papel-tarjeta)' }} />
      <rect width={600} height={840} filter="url(#paperLit)" opacity={0.22} style={{ mixBlendMode: 'multiply' }} />

      {/* doble filete dorado */}
      <rect x={24} y={24} width={552} height={792} rx={4} fill="none" stroke={ORO} strokeWidth={1} opacity={0.85} />
      <rect x={31} y={31} width={538} height={778} rx={2} fill="none" stroke={ORO} strokeWidth={0.5} opacity={0.5} />

      {/* dos globos con hilos que se juntan en un moño */}
      <g>
        <path d="M274 190C268 222 290 252 300 292" fill="none" stroke={ORO} strokeWidth={0.9} />
        <path d="M324 199C330 230 310 258 300 292" fill="none" stroke={ORO} strokeWidth={0.9} />
        <path d="M300 292C292 285 284 288 288 294C291 298 297 296 300 292ZM300 292C308 285 316 288 312 294C309 298 303 296 300 292Z" fill={ORO} />
        <path d="M300 292L296 310M300 292L304 309" stroke={ORO} strokeWidth={0.8} strokeLinecap="round" />
        <g transform="rotate(-9 268 150)">
          <use href="#bal" x={214} y={72} width={108} height={140} style={{ color: NINA }} />
        </g>
        <g transform="rotate(8 330 158)">
          <use href="#bal" x={278} y={86} width={104} height={135} style={{ color: NINO }} />
        </g>
      </g>

      <g textAnchor="middle">
        <text x={300} y={366} fontFamily={SANS} fontSize={12.5} fontWeight={600} letterSpacing={4.5} style={SUAVE}>
          ACOMPÁÑANOS A LA REVELACIÓN
        </text>

        <text x={300} y={432} fontFamily={DISPLAY} fontSize={58} fontWeight={600} letterSpacing={-1.5}>
          <tspan style={{ fill: TINTA_NINA }}>¿Niña</tspan>
          <tspan fontSize={30} fontWeight={300} dx={6} dy={-6} style={SUAVE}>
            o
          </tspan>
          <tspan dx={6} dy={6} style={{ fill: TINTA_NINO }}>
            niño?
          </tspan>
        </text>

        {papas && (
          <text x={300} y={470} fontFamily={SANS} fontSize={talla(`de ${papas}`, 17, 420)} fontStyle="italic" style={SUAVE}>
            de {papas}
          </text>
        )}

        {/* separador */}
        <line x1={258} y1={504} x2={290} y2={504} stroke={ORO} strokeWidth={0.8} />
        <path d="M300 500L304 504L300 508L296 504Z" fill={ORO} />
        <line x1={310} y1={504} x2={342} y2={504} stroke={ORO} strokeWidth={0.8} />

        {/* fecha clásica: día de la semana | número | mes y año */}
        <text x={236} y={590} fontFamily={SANS} fontSize={14} fontWeight={600} letterSpacing={3.5} textAnchor="end" style={TINTA}>
          {f.semana.toUpperCase()}
        </text>
        <line x1={256} y1={548} x2={256} y2={612} stroke={ORO} strokeWidth={0.8} />
        <text x={300} y={604} fontFamily={DISPLAY} fontSize={62} fontWeight={500} letterSpacing={-2} style={TINTA}>
          {f.dia}
        </text>
        <line x1={344} y1={548} x2={344} y2={612} stroke={ORO} strokeWidth={0.8} />
        <text x={364} y={582} fontFamily={SANS} fontSize={14} fontWeight={600} letterSpacing={3.5} textAnchor="start" style={TINTA}>
          {f.mes.toUpperCase()}
        </text>
        <text x={364} y={602} fontFamily={SANS} fontSize={13} letterSpacing={3} textAnchor="start" style={SUAVE}>
          {f.anio}
        </text>

        <text x={300} y={656} fontFamily={SANS} fontSize={13} fontWeight={600} letterSpacing={4} style={SUAVE}>
          A LAS {hora(evento.fecha_hora).toUpperCase()}
        </text>

        <text x={300} y={712} fontFamily={DISPLAY} fontSize={talla(lugar, 21, 440, 0.55)} fontWeight={600} letterSpacing={-0.3} style={TINTA}>
          {lugar}
        </text>
        {direccion && (
          <text x={300} y={740} fontFamily={SANS} fontSize={talla(direccion, 14, 460, 0.52)} style={SUAVE}>
            {direccion}
          </text>
        )}

        <text x={300} y={784} fontFamily={SANS} fontSize={11} fontWeight={600} letterSpacing={3.5} opacity={0.75} style={SUAVE}>
          TE ESPERAMOS
        </text>
      </g>
    </svg>
  );
}
