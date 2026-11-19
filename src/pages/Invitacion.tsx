import { useEffect, useRef, useState } from 'react';
import { EscenaSobre } from '../features/sobre/EscenaSobre';
import { Historia } from '../features/historia/Historia';
import { Prediccion } from '../features/prediccion/Prediccion';
import { Conteo } from '../features/prediccion/Conteo';
import { Detalles } from '../features/asistencia/Detalles';
import { Revelacion } from '../features/revelacion/Revelacion';
import { Celebracion } from '../features/revelacion/Celebracion';
import { Recuerdos } from '../features/recuerdos/Recuerdos';
import { useInvitacion } from '../hooks/useInvitacion';
import { api } from '../lib/api';
import type { MiPrediccion } from '../lib/types';
import '../styles/invitacion.css';

export function Invitacion() {
  const { evento, predicciones, historia, recuerdos, error } = useInvitacion();
  const [mia, setMia] = useState<MiPrediccion | null>(null);
  // El resto de la invitación solo existe después de abrir el sobre.
  const [abierto, setAbierto] = useState(false);
  const [reinicio, setReinicio] = useState(0);
  const [fiesta, setFiesta] = useState(false);
  const estadoPrevio = useRef<string | null>(null);

  useEffect(() => {
    api.miPrediccion().then(setMia).catch(() => setMia(null));
  }, []);

  // Muestra la celebración solo si la revelación ocurre mientras la página está abierta.
  useEffect(() => {
    if (!evento) return;
    if (estadoPrevio.current === 'pendiente' && evento.estado === 'revelado') setFiesta(true);
    if (estadoPrevio.current === 'revelado' && evento.estado === 'pendiente') setFiesta(false);
    estadoPrevio.current = evento.estado;
  }, [evento]);

  if (error) {
    return (
      <div className="x estado">
        <p className="hand">No pudimos cargar la invitación.</p>
        <p>{error}</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="x estado" aria-busy="true">
        <p className="hand">Preparando tu invitación…</p>
      </div>
    );
  }

  return (
    <div className="x">
      {api.modo === 'demo' && (
        <p className="demo-banner">
          Modo demo: los datos se guardan solo en este navegador. <a href="/panel">Abrir el panel</a>
        </p>
      )}
      <EscenaSobre evento={evento} onAbierto={() => setAbierto(true)} reinicio={reinicio} />
      {abierto && (
      <main className="page">
        <svg className="paper" aria-hidden="true">
          <rect width="100%" height="100%" filter="url(#paperLit)" />
        </svg>
        <Historia fotos={historia} />
        <Prediccion evento={evento} mia={mia} onCambio={setMia} />
        <Conteo predicciones={predicciones} miNombre={mia?.nombre} />
        <Detalles evento={evento} nombreSugerido={mia?.nombre} />
        <Revelacion evento={evento} predicciones={predicciones} mia={mia} />
        <Recuerdos evento={evento} fotos={recuerdos} nombreSugerido={mia?.nombre} />
        <footer className="foot">
          {evento.nombres_papas && <p className="sig">Con cariño, {evento.nombres_papas}</p>}
          <button
            type="button"
            className="lnk"
            onClick={() => {
              window.scrollTo({ top: 0 });
              setAbierto(false);
              setReinicio((n) => n + 1);
            }}
          >
            Ver el sobre otra vez
          </button>
        </footer>
      </main>
      )}
      {fiesta && evento.resultado && (
        <Celebracion
          sexo={evento.resultado}
          onCerrar={() => {
            setFiesta(false);
            document.getElementById('revelacion')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}
