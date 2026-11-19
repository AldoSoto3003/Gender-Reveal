import { useState } from 'react';
import type { FotoHistoria } from '../../lib/types';

const GIROS = ['rt1', 'rt2', 'rt3', 'rt4', 'rt5', 'rt6'];
const CINTAS = ['tape-p', '', 'tape-b', '', 'tape-p', 'tape-b'];
const TONOS = ['tn1', 'tn2', 'tn3', 'tn4'];

/** Ecografía de muestra mientras no se sube la real. */
function EcografiaMuestra({ titulo, i }: { titulo: string; i: number }) {
  return (
    <svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label={titulo}>
      <rect width={160} height={200} fill="#060606" />
      <g filter="url(#usN)">
        <path d="M80 22L150 160A120 120 0 0 1 10 160Z" fill="#3B3B3B" />
        <ellipse cx={i % 2 ? 66 : 74} cy={92} rx={22} ry={19} fill="#A2A2A2" />
        <ellipse cx={88} cy={110} rx={34} ry={16} fill="#848484" transform="rotate(-14 88 110)" />
        <path d="M30 146Q80 132 130 148" fill="none" stroke="#BABABA" strokeWidth={5} />
      </g>
      <text x={8} y={192} fontFamily="Figtree, sans-serif" fontSize={6.5} fill="#BFBFBF">
        Muestra
      </text>
    </svg>
  );
}

export function Historia({ fotos }: { fotos: FotoHistoria[] }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  if (fotos.length === 0) return null;

  return (
    <section className="sec" aria-labelledby="h-fotos">
      <div className="wrap">
        <h2 className="h2" id="h-fotos">
          Nuestra historia hasta ahora
        </h2>
        <p className="sub">Algunos momentos de estos meses mientras esperamos conocerte.</p>
        <div className="prints">
          {fotos.map((f, i) => {
            const on = abierta === f.id;
            return (
              <button
                key={f.id}
                type="button"
                className={`print ${GIROS[i % GIROS.length]}${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() => setAbierta(on ? null : f.id)}
              >
                {CINTAS[i % CINTAS.length] && <span className={`tape ${CINTAS[i % CINTAS.length]}`} aria-hidden="true" />}
                <span className="pimg">
                  {f.url ? (
                    <img src={f.url} alt={f.titulo} loading="lazy" />
                  ) : f.tipo === 'ecografia' ? (
                    <EcografiaMuestra titulo={f.titulo} i={i} />
                  ) : (
                    <span className={`slot ${TONOS[i % TONOS.length]}`}>
                      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" stroke="#7A746D" strokeWidth="1.6" aria-hidden="true">
                        <rect x="5" y="9" width="30" height="22" rx="2" />
                        <circle cx="14" cy="17" r="3" />
                        <path d="M5 27l9-7 7 5 5-4 9 7" />
                      </svg>
                      <span className="hand">Tu foto</span>
                    </span>
                  )}
                </span>
                <span className="pcap hand">{f.titulo}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
