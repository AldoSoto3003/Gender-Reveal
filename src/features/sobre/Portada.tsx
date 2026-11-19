import { useEffect, useState } from 'react';
import { fechaLarga, hora } from '../../lib/formato';
import type { Evento } from '../../lib/types';
import { AZUL, ROSA } from '../../ui/SvgDefs';

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

/** La invitación a pantalla completa: es lo que hay "dentro" del sobre. */
export function Portada({ evento }: { evento: Evento }) {
  const cuenta = useCuenta(evento.fecha_hora);
  const papas = evento.nombres_papas.trim();

  return (
    <section className="pt" aria-label="Invitación">
      <svg className="pt-papel" aria-hidden="true">
        <rect width="100%" height="100%" filter="url(#paperLit)" />
      </svg>

      <Globo color={AZUL} className="pt-g1" />
      <Globo color={ROSA} className="pt-g2" />
      <Globo color={ROSA} className="pt-g3" />
      <Globo color={AZUL} className="pt-g4" />

      <div className="pt-texto">
        <p className="pt-pre">Acompáñanos a la</p>
        <h1 className="pt-titulo">
          <span className="pt-rosa">¿Niña</span> <span className="pt-o">o</span> <span className="pt-azul">niño?</span>
        </h1>
        <p className="pt-sub">Revelación de género{papas ? ` de ${papas}` : ''}</p>
        <p className="pt-fecha">
          {fechaLarga(evento.fecha_hora)}, {hora(evento.fecha_hora)}
        </p>
        {evento.lugar && <p className="pt-lugar">{evento.lugar}</p>}
        <div className="pt-cuenta" role="timer" aria-label="Tiempo que falta">
          {cuenta.map((c) => (
            <div key={c.l}>
              <span className="pt-n">{c.n}</span>
              <span className="pt-l">{c.l}</span>
            </div>
          ))}
        </div>
      </div>

      <a className="pt-desliza" href="#votar">
        Desliza para ver más
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
