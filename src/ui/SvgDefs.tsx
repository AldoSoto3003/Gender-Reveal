/**
 * Definiciones SVG compartidas: dorados, filtros de acuarela y papel, y los símbolos del globo y el sello.
 * Se montan una sola vez en la raíz de la app.
 */
const BRILLOS: [number, number, number, number][] = [
  [176.8, 96.6, 2.0, 0.87], [113.9, 170.2, 1.8, 0.73], [146.2, 168.9, 2.6, 0.88], [169.9, 159.2, 2.2, 0.68],
  [165.6, 115.5, 0.9, 0.58], [102.2, 202.0, 1.3, 0.92], [116.5, 194.3, 2.6, 0.99], [161.6, 167.0, 2.0, 0.81],
  [143.2, 153.9, 2.6, 0.7], [157.8, 168.9, 0.9, 0.9], [171.7, 57.8, 1.0, 0.72], [145.5, 177.7, 0.8, 0.9],
  [142.0, 179.4, 0.8, 0.6], [171.0, 145.4, 1.2, 0.95], [96.8, 195.4, 1.8, 0.67], [181.7, 134.4, 1.8, 0.62],
  [174.0, 152.7, 1.6, 0.98], [156.5, 108.7, 1.6, 0.93], [67.7, 192.7, 2.7, 0.95], [126.6, 197.1, 0.9, 0.76],
  [94.1, 186.4, 2.4, 0.58], [96.9, 179.5, 2.3, 0.71], [175.3, 62.3, 2.8, 0.85], [139.7, 182.6, 2.4, 0.62],
  [79.1, 195.1, 2.5, 0.84], [177.8, 106.8, 1.9, 0.89], [114.3, 197.3, 1.5, 0.93], [175.9, 90.3, 1.8, 0.71],
  [85.7, 184.6, 1.7, 0.93], [165.2, 97.4, 2.3, 0.98], [158.3, 127.4, 1.2, 0.82], [146.9, 169.5, 1.9, 0.7],
  [178.6, 140.3, 1.5, 0.91], [165.8, 143.4, 1.2, 0.77], [144.1, 167.9, 2.4, 0.72], [151.7, 89.4, 1.8, 0.99],
  [126.7, 161.9, 2.3, 0.83], [75.0, 188.9, 1.2, 0.79], [175.8, 111.4, 1.3, 0.89], [171.3, 114.0, 1.9, 0.89],
  [109.5, 186.6, 2.7, 0.76], [96.8, 174.4, 2.6, 0.59], [129.6, 167.6, 2.2, 0.97], [178.2, 70.8, 0.9, 0.96],
  [145.7, 150.5, 2.8, 0.63], [104.3, 182.6, 1.9, 0.74], [118.7, 190.5, 1.1, 0.73], [169.7, 76.9, 2.2, 0.78],
  [161.5, 147.7, 1.2, 0.94], [76.3, 171.3, 1.1, 0.83], [86.0, 187.3, 1.2, 0.83], [167.1, 165.1, 0.8, 0.65],
  [170.9, 133.3, 1.8, 0.63], [152.4, 154.9, 1.2, 0.82], [159.9, 78.8, 1.7, 0.75],
];

const CUERPO = 'M100 8C150 8 188 48 188 102C188 160 146 200 104 206L96 206C54 200 12 160 12 102C12 48 50 8 100 8Z';

export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9C7424" />
          <stop offset="0.35" stopColor="#E6C66F" />
          <stop offset="0.5" stopColor="#FFF1C1" />
          <stop offset="0.68" stopColor="#CFA650" />
          <stop offset="1" stopColor="#9E7528" />
        </linearGradient>
        <linearGradient id="goldLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B98E3A" />
          <stop offset="0.3" stopColor="#F0D58C" />
          <stop offset="0.55" stopColor="#C39A45" />
          <stop offset="0.8" stopColor="#EBCB7C" />
          <stop offset="1" stopColor="#A9802F" />
        </linearGradient>
        <radialGradient id="wax" cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#F6DE9C" />
          <stop offset="0.35" stopColor="#D2A954" />
          <stop offset="0.75" stopColor="#A47A2C" />
          <stop offset="1" stopColor="#7C5A1C" />
        </radialGradient>

        <filter id="wc" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves={4} seed={3} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale={9} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feMorphology in="d" operator="erode" radius={2.5} result="er" />
          <feComposite in="d" in2="er" operator="out" result="edge" />
          <feGaussianBlur in="edge" stdDeviation={1.2} result="edgeB" />
          <feColorMatrix in="edgeB" type="matrix" values="0.62 0 0 0 0  0 0.62 0 0 0  0 0 0.66 0 0  0 0 0 0.5 0" result="edgeD" />
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={2} seed={8} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.75 1.18" result="gA" />
          <feComposite in="d" in2="gA" operator="in" result="grain" />
          <feMerge>
            <feMergeNode in="grain" />
            <feMergeNode in="edgeD" />
          </feMerge>
        </filter>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={1.6} />
        </filter>
        <filter id="paperLit" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={5} seed={2} result="n" />
          <feDiffuseLighting in="n" lightingColor="#FFFFFF" surfaceScale={1.7} diffuseConstant={1.05} result="l">
            <feDistantLight azimuth={235} elevation={58} />
          </feDiffuseLighting>
          <feColorMatrix in="l" type="matrix" values="0.13 0 0 0 0.865  0.13 0 0 0 0.85  0.13 0 0 0 0.825  0 0 0 0 1" />
        </filter>
        <filter id="grainLit" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={4} seed={9} result="n" />
          <feDiffuseLighting in="n" lightingColor="#FFFFFF" surfaceScale={1.2} diffuseConstant={1} result="l">
            <feDistantLight azimuth={225} elevation={60} />
          </feDiffuseLighting>
          <feColorMatrix in="l" type="matrix" values="0.25 0 0 0 0.76  0.25 0 0 0 0.76  0.25 0 0 0 0.76  0 0 0 0 1" />
        </filter>
        <filter id="linenF" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.012" numOctaves={2} seed={4} result="a" />
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.9" numOctaves={2} seed={6} result="b" />
          <feBlend in="a" in2="b" mode="multiply" result="c" />
          <feColorMatrix in="c" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 -1.4 0.95" />
        </filter>
        <filter id="usN" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={5} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.7 -0.6" result="s" />
          <feComposite in="s" in2="SourceGraphic" operator="in" result="sp" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={5} result="sf" />
          <feMerge>
            <feMergeNode in="sf" />
            <feMergeNode in="sp" />
          </feMerge>
        </filter>

        <symbol id="bal" viewBox="0 0 200 260">
          <g filter="url(#wc)">
            <path d={CUERPO} fill="currentColor" opacity={0.8} />
            <path d={CUERPO} fill="#1E2A3A" opacity={0.1} transform="translate(30 36) scale(0.78)" />
            <ellipse cx={80} cy={82} rx={50} ry={56} fill="#FFFFFF" opacity={0.2} />
            <path d="M93 205L107 205L105 216L95 216Z" fill="currentColor" opacity={0.9} />
          </g>
          <path d="M50 70C52 48 66 34 84 30C78 44 70 56 62 76C58 82 49 80 50 70Z" fill="#FFFFFF" opacity={0.72} filter="url(#soft)" />
          <ellipse cx={62} cy={104} rx={7} ry={12} fill="#FFFFFF" opacity={0.55} filter="url(#soft)" />
          {BRILLOS.map(([x, y, r, o], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="url(#gold)" opacity={o} />
          ))}
        </symbol>

        <symbol id="sealArt" viewBox="0 0 100 100">
          <path
            d="M50 3C60 2 67 7 75 10C86 15 95 26 97 40C99 52 96 63 90 73C83 85 71 95 56 97C43 99 30 95 21 88C10 80 3 67 3 53C2 40 7 27 16 18C25 9 37 4 50 3Z"
            fill="url(#wax)"
          />
          <path d="M88 30C92 36 95 44 94 52" fill="none" stroke="#FFF2C4" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />
          <circle cx={50} cy={50} r={30} fill="none" stroke="#6E4F16" strokeOpacity={0.55} strokeWidth={2.2} />
          <circle cx={50} cy={49} r={30} fill="none" stroke="#FFF2C4" strokeOpacity={0.4} strokeWidth={1} />
          <text x={50} y={62.5} textAnchor="middle" fontFamily="Patrick Hand, Comic Sans MS, cursive" fontSize={36} fill="#FFF2C4" fillOpacity={0.45}>
            ?
          </text>
          <text x={50} y={63.6} textAnchor="middle" fontFamily="Patrick Hand, Comic Sans MS, cursive" fontSize={36} fill="#6E4F16" fillOpacity={0.85}>
            ?
          </text>
          <ellipse cx={34} cy={25} rx={14} ry={6} fill="#FFFBEA" fillOpacity={0.45} transform="rotate(-30 34 25)" />
        </symbol>
      </defs>
    </svg>
  );
}

export const ROSA = '#F2A9A0';
export const AZUL = '#9DB6DB';
