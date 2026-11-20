import { useEffect, useState } from 'react';
import { fechaLarga, hora } from '../../lib/formato';
import type { Evento } from '../../lib/types';
import { CLARO_NINA, NINA, NINO } from '../../ui/SvgDefs';

function useCuenta(iso: string) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  let ms = Math.max(0, Date.parse(iso) - ahora);
  const d = Math.floor(ms / 864e5);
  ms -= d * 864e5;
  const h = Math.floor(ms / 36e5);
  ms -= h * 36e5;
  const m = Math.floor(ms / 6e4);
  const s = Math.floor((ms - m * 6e4) / 1e3);
  const dos = (n: number) => String(n).padStart(2, '0');
  return [
    { n: String(d), l: 'días' },
    { n: dos(h), l: 'horas' },
    { n: dos(m), l: 'min' },
    { n: dos(s), l: 'seg' },
  ];
}

function Globo({ color, className }: { color: string; className: string }) {
  return (
    <svg className={`pt-globo ${className}`} viewBox="0 0 200 520" aria-hidden="true">
      <path d="M100 216C84 300 120 380 92 520" fill="none" stroke="url(#goldLine)" strokeWidth={2.2} />
      <path d="M100 216C114 300 88 400 110 520" fill="none" stroke="url(#goldLine)" strokeWidth={1.2} />
      <use href="#bal" x={0} y={0} width={200} height={260} style={{ color }} />
    </svg>
  );
}

const Calendario = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
const Reloj = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

/** La invitación a pantalla completa: es lo que hay "dentro" del sobre. */
export function Portada({ evento }: { evento: Evento }) {
  const cuenta = useCuenta(evento.fecha_hora);
  const papas = evento.nombres_papas.trim();

  return (
    <section className="pt" aria-label="Invitación">
      <div className="pt-globos" aria-hidden="true">
        <Globo color={NINA} className="pt-g1" />
        <Globo color={NINO} className="pt-g2" />
        <Globo color={CLARO_NINA} className="pt-g3" />
      </div>

      <div className="pt-texto">
        <br/>
        <br/>
        <br/>
        <p className="pt-pre">Acompáñanos a la revelación{papas ? ` de ${papas}` : ''}</p>
        <h1 className="pt-titulo">
          <span className="pt-nina">¿Niña</span>
          <span className="pt-o">o</span>
          <span className="pt-nino">niño?</span>
        </h1>
        <div className="pt-cuando">
          <span>
            <Calendario />
            {fechaLarga(evento.fecha_hora)}
          </span>
          <span>
            <Reloj />
            {hora(evento.fecha_hora)}
          </span>
        </div>
        {evento.lugar && <p className="pt-lugar">{evento.lugar}</p>}
        <div className="pt-cuenta" role="timer" aria-label="Tiempo que falta">
          {cuenta.map((c) => (
            <div key={c.l}>
              <span className="pt-n">{c.n}</span>
              <span className="pt-l">{c.l}</span>
            </div>
          ))}
        </div>
        <a className="btn pt-cta" href="#confirmar">
          Confirmar mi asistencia
        </a>
      </div>

      <a className="pt-desliza" href="#contenido">
        Desliza para ver más
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
