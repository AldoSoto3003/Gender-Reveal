import type { ReactNode } from 'react';

interface Props {
  color: string;
  /** Texto a mano dentro del globo */
  texto?: string;
  colorTexto?: string;
  /** Dibuja los hilos dorados debajo */
  hilos?: boolean;
  className?: string;
  children?: ReactNode;
}

/** Globo de acuarela con brillos dorados (usa el símbolo #bal de SvgDefs). */
export function Globo({ color, texto, colorTexto = '#4E5A6E', hilos = true, className }: Props) {
  return (
    <svg className={className} viewBox={hilos ? '0 0 200 380' : '0 0 200 260'} aria-hidden="true" style={{ overflow: 'visible' }}>
      {hilos && (
        <>
          <path d="M100 216C88 270 116 320 96 380" fill="none" stroke="url(#goldLine)" strokeWidth={2.4} />
          <path d="M100 216C110 280 90 330 108 380" fill="none" stroke="url(#goldLine)" strokeWidth={1.3} />
        </>
      )}
      <use href="#bal" x={0} y={0} width={200} height={260} style={{ color }} />
      {texto && (
        <text
          x={100}
          y={120}
          textAnchor="middle"
          fontFamily="Patrick Hand, Comic Sans MS, cursive"
          fontSize={46}
          letterSpacing={3}
          fill={colorTexto}
        >
          {texto}
        </text>
      )}
    </svg>
  );
}
