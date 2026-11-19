import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { Evento } from '../../lib/types';
import { Tarjeta } from '../../ui/Tarjeta';

type Fase = 'cerrado' | 'abriendo' | 'abierto';

const HOJUELAS = [
  { l: 22, t: 31, r: 20, s: 1, fx: false },
  { l: 70, t: 22, r: -35, s: 0.8, fx: true },
  { l: 76, t: 71, r: 60, s: 1, fx: false },
  { l: 28, t: 78, r: -10, s: 0.7, fx: true },
  { l: 64, t: 84, r: 80, s: 0.6, fx: true },
  { l: 15, t: 60, r: -50, s: 0.75, fx: false },
];

interface Props {
  evento: Evento;
  /** Si el invitado ya lo abrió antes, arranca abierto */
  yaAbierto: boolean;
  onAbierto: () => void;
  /** Cambia para volver a mostrar el sobre cerrado */
  reinicio: number;
}

export function EscenaSobre({ evento, yaAbierto, onAbierto, reinicio }: Props) {
  const [fase, setFase] = useState<Fase>(yaAbierto ? 'abierto' : 'cerrado');
  const [salida, setSalida] = useState(false);
  const [inc, setInc] = useState({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const t = useRef<number | null>(null);
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    setSalida(false);
    setFase('cerrado');
  }, [reinicio]);

  useEffect(() => () => {
    if (t.current) clearTimeout(t.current);
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  function abrir(e?: MouseEvent) {
    e?.stopPropagation();
    if (fase !== 'cerrado') return;
    setFase('abriendo');
    setSalida(true);
    t.current = window.setTimeout(() => {
      setFase('abierto');
      onAbierto();
    }, 2300);
  }

  function mover(e: MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      setInc({ x, y });
    });
  }

  // Al abrir en esta visita, el sobre se queda un momento para animar su salida.
  const mostrarSobre = fase !== 'abierto' || salida;

  return (
    <header className="scene" onMouseMove={mover} aria-label="Invitación en un sobre">
      <div className="table" aria-hidden="true" />
      <svg className="linen" aria-hidden="true">
        <rect width="100%" height="100%" filter="url(#linenF)" />
      </svg>
      {HOJUELAS.map((h, i) => (
        <div
          key={i}
          className={`flake${h.fx ? ' fx' : ''}`}
          style={{ left: `${h.l}%`, top: `${h.t}%`, transform: `rotate(${h.r}deg) scale(${h.s})` }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 12 9">
            <path d={i % 2 ? 'M0 4L6 0L11 3L7 9Z' : 'M1 3L7 0L12 5L5 9Z'} fill="url(#gold)" />
          </svg>
        </div>
      ))}

      {mostrarSobre && (
        <>
          <div className={`shadow${fase === 'abierto' ? ' gone' : ''}`} aria-hidden="true" />
          <div className={`stagec${fase === 'cerrado' ? ' can-open' : ''}`} onClick={abrir}>
            <div className="tilt" style={{ transform: `rotateX(${(-inc.y * 10).toFixed(2)}deg) rotateY(${(inc.x * 12).toFixed(2)}deg)` }}>
              <div className={`lay${fase === 'abierto' ? ' away' : ''}`}>
                <div className={`env${fase === 'cerrado' ? '' : ' opening'}`}>
                  <div className="e-back" />
                  <div className="e-card" aria-hidden="true">
                    <Tarjeta evento={evento} />
                  </div>
                  <svg className="e-pocket" viewBox="0 0 420 590" preserveAspectRatio="none" aria-hidden="true">
                    <rect width={420} height={590} fill="#C3CBD3" />
                    <path d="M0 0L198 320L0 590Z" fill="#BEC7D0" />
                    <path d="M420 0L222 320L420 590Z" fill="#B6C0CA" />
                    <path d="M0 590L210 300L420 590Z" fill="#C7CFD7" />
                    <path d="M0 590L210 300L420 590" fill="none" stroke="#1E2A3A" strokeOpacity={0.08} strokeWidth={2} />
                    <text
                      x={210}
                      y={500}
                      textAnchor="middle"
                      fontFamily="Patrick Hand, Comic Sans MS, cursive"
                      fontSize={27}
                      fill="#56647A"
                      letterSpacing={2}
                      transform="rotate(-3 210 500)"
                    >
                      PARA TI, CON CARIÑO
                    </text>
                  </svg>
                  <div className="e-flap">
                    <svg className="face face-f" viewBox="0 0 420 250" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M0 0L420 0L210 250Z" fill="#C9D1D9" />
                      <path d="M0 0L210 250L420 0" fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.5} />
                    </svg>
                    <svg className="face face-b" viewBox="0 0 420 250" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M0 0L420 0L210 250Z" fill="#F4EFE6" />
                      <path d="M14 8L406 8L210 236Z" fill="#F9E9E4" />
                      {[
                        [120, 40, 2], [180, 80, 1.4], [250, 52, 2.2], [300, 30, 1.2], [210, 140, 1.8], [160, 24, 1.1], [270, 110, 1.6],
                      ].map(([cx, cy, r], i) => (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="url(#gold)" />
                      ))}
                    </svg>
                    <div className="seal" aria-hidden="true">
                      <svg viewBox="0 0 100 100">
                        <use href="#sealArt" />
                      </svg>
                    </div>
                  </div>
                  <svg className="grain" aria-hidden="true">
                    <rect width="100%" height="100%" filter="url(#grainLit)" />
                  </svg>
                  {fase === 'cerrado' && (
                    <button type="button" className="seal-hit" aria-label="Abrir la invitación" onClick={abrir} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {fase === 'abierto' && (
        <>
          <div className={`present${salida ? '' : ' instant'}`}>
            <div className="ptilt" style={{ transform: `rotateX(${(-inc.y * 6).toFixed(2)}deg) rotateY(${(inc.x * 9).toFixed(2)}deg)` }}>
              <Tarjeta evento={evento} />
            </div>
          </div>
          <p className="scroll-cue hand">Desliza para ver más</p>
        </>
      )}

      {fase === 'cerrado' && (
        <div className="hint">
          <p className="hand">Toca el sello para abrir tu invitación</p>
          <button type="button" className="btn btn-o" onClick={abrir}>
            Abrir invitación
          </button>
        </div>
      )}
    </header>
  );
}
