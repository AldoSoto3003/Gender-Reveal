import { useEffect, useRef, useState } from 'react';
import type { Evento } from '../../lib/types';
import { Portada } from './Portada';
import './portada.css';
import './sobre.css';

/**
 * Sobre a pantalla completa: la pantalla entera es el reverso de un sobre de papel.
 * Debajo está la portada de la invitación, también a pantalla completa.
 * Secuencia al abrir:
 *   abriendo → el sello se parte y la solapa gira hacia arriba (la portada se asoma por la abertura)
 *   abierto  → el sobre baja y sale; la portada queda ocupando toda la pantalla
 */
type Fase = 'cerrado' | 'abriendo' | 'abierto';

interface Props {
  evento: Evento;
  onAbierto?: () => void;
  /** Cambia para volver a mostrar el sobre cerrado */
  reinicio: number;
}

function Papel({ id }: { id: string }) {
  return (
    <svg className="sb-textura" aria-hidden="true">
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={5} seed={id.length * 7} result="n" />
        <feDiffuseLighting in="n" lightingColor="#FFFFFF" surfaceScale={2.2} diffuseConstant={1.02} result="l">
          <feDistantLight azimuth={235} elevation={57} />
        </feDiffuseLighting>
        <feColorMatrix in="l" type="matrix" values="0.26 0 0 0 .75  0.26 0 0 0 .75  0.26 0 0 0 .75  0 0 0 0 1" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/**
 * Regla: lo primero que ve el invitado SIEMPRE es el sobre cerrado.
 * Nunca se arranca abierto (aunque ya lo haya abierto antes) y la invitación
 * no se dibuja hasta que se rompe el sello.
 */
export function EscenaSobre({ evento, onAbierto, reinicio }: Props) {
  const [fase, setFase] = useState<Fase>('cerrado');
  const [animado, setAnimado] = useState(true);
  const tiempos = useRef<number[]>([]);
  const ultimoReinicio = useRef(reinicio);

  const limpiar = () => {
    tiempos.current.forEach((t) => clearTimeout(t));
    tiempos.current = [];
  };

  // "Ver el sobre otra vez": el sobre vuelve cerrado al instante, sin animación al revés.
  useEffect(() => {
    if (ultimoReinicio.current === reinicio) return;
    ultimoReinicio.current = reinicio;
    limpiar();
    setAnimado(false);
    setFase('cerrado');
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnimado(true)));
    return () => cancelAnimationFrame(r);
  }, [reinicio]);

  useEffect(() => limpiar, []);

  function abrir() {
    if (fase !== 'cerrado') return;
    setAnimado(true);
    setFase('abriendo');
    tiempos.current.push(
      window.setTimeout(() => {
        setFase('abierto');
        onAbierto?.();
      }, 1350),
    );
  }

  return (
    <header className={`sb-escena sb-${fase}${animado ? '' : ' sb-instante'}`} aria-label="Invitación en un sobre">
      {fase !== 'cerrado' && <Portada evento={evento} />}

      <div className="sb-bolsillo-sombra" aria-hidden="true">
        <div className="sb-bolsillo" onClick={abrir}>
          <Papel id="papelBolsillo" />
          <svg className="sb-pliegues" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100L50 55L100 100" fill="none" stroke="#7A5E3A" strokeOpacity=".16" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <path d="M0 100L50 55L100 100Z" fill="#FFFFFF" fillOpacity=".12" />
            <path d="M100 0L50 58L100 100Z" fill="#5E4628" fillOpacity=".04" />
          </svg>
          <img className="sb-ilus sb-ilus-i" src="/sobre/globos.svg" alt="" />
          <img className="sb-ilus sb-ilus-d" src="/sobre/zapatitos.svg" alt="" />
          <div className="sb-luz" />
        </div>
      </div>

      <div className="sb-solapa-sombra" aria-hidden="true">
        <div className="sb-solapa" onClick={abrir}>
          <div className="sb-cara sb-frente">
            <Papel id="papelSolapa" />
            <div className="sb-luz" />
            <svg className="sb-canto" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0L50 100L100 0" fill="none" stroke="#FFFFFF" strokeOpacity=".7" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="sb-cara sb-forro" />
        </div>
      </div>

      <div className="sb-sello" aria-hidden="true">
        <img className="sb-mitad sb-mitad-i" src="/sobre/sello.svg" alt="" />
        <img className="sb-mitad sb-mitad-d" src="/sobre/sello.svg" alt="" />
      </div>

      <button type="button" className="sb-pista" onClick={abrir} disabled={fase !== 'cerrado'}>
        Toca el sello para abrir
      </button>
    </header>
  );
}
