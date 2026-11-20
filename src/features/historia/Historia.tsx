import type { FotoHistoria } from '../../lib/types';

const TONOS = ['tn1', 'tn2', 'tn3', 'tn4'];

/** Ecografía de muestra mientras no se sube la real. */
function EcografiaMuestra({ titulo, i }: { titulo: string; i: number }) {
  return (
    <svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${titulo} (muestra)`}>
      <rect width={160} height={200} fill="#11130f" />
      <g filter="url(#usN)">
        <path d="M80 22L150 160A120 120 0 0 1 10 160Z" fill="#33372c" />
        <ellipse cx={i % 2 ? 66 : 74} cy={92} rx={22} ry={19} fill="#9aa08c" />
        <ellipse cx={88} cy={110} rx={34} ry={16} fill="#7d8371" transform="rotate(-14 88 110)" />
        <path d="M30 146Q80 132 130 148" fill="none" stroke="#b4b9a6" strokeWidth={5} />
      </g>
      <text x={10} y={190} fontFamily="Figtree, sans-serif" fontSize={8} letterSpacing={1} fill="#a9ae9b">
        MUESTRA
      </text>
    </svg>
  );
}

export function Historia({ fotos }: { fotos: FotoHistoria[] }) {
  if (fotos.length === 0) return null;

  return (
    <section className="sec" id="historia" aria-labelledby="h-fotos">
      <div className="wrap">
        <div className="sec-cab">
          <div>
            <span className="tag">Hasta ahora</span>
            <h2 className="h2" id="h-fotos">
              Nuestra historia
            </h2>
          </div>
          <p>Algunos momentos de estos meses mientras esperamos conocerte. Desliza para ver todas.</p>
        </div>
        <div className="tira" tabIndex={0} aria-label="Fotos de nuestra historia">
          {fotos.map((f, i) => (
            <figure key={f.id} className="foto">
              <div className={`foto-img ${f.url || f.tipo === 'ecografia' ? '' : TONOS[i % TONOS.length]}`}>
                {f.url ? (
                  <img src={f.url} alt={f.titulo} loading="lazy" />
                ) : f.tipo === 'ecografia' ? (
                  <EcografiaMuestra titulo={f.titulo} i={i} />
                ) : (
                  <span className="foto-vacia">
                    <svg width="34" height="34" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <rect x="5" y="9" width="30" height="22" rx="3" />
                      <circle cx="14" cy="17" r="3" />
                      <path d="M5 27l9-7 7 5 5-4 9 7" />
                    </svg>
                    Tu foto aquí
                  </span>
                )}
              </div>
              <figcaption>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {f.titulo}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
