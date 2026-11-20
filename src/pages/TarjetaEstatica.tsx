import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Evento } from '../lib/types';
import { Tarjeta } from '../ui/Tarjeta';

/**
 * /tarjeta: la tarjeta sola, sin interacción, para hacer captura y mandarla como imagen por WhatsApp
 * o imprimirla. En el celular, una captura de pantalla de esta página queda lista para compartir.
 */
export function TarjetaEstatica() {
  const [evento, setEvento] = useState<Evento | null>(null);

  useEffect(() => {
    document.title = 'Invitación';
    api.evento().then(setEvento).catch(() => setEvento(null));
  }, []);

  return (
    <div className="tarjeta-sola">
      {evento && (
        <figure>
          <Tarjeta evento={evento} className="tarjeta-svg" />
          <figcaption>
            Abre tu invitación en <strong>{window.location.host}</strong>
            {evento.telefono && <> o confirma al {evento.telefono}</>}
          </figcaption>
        </figure>
      )}
      <style>{`
        body { background: var(--mesa); }
        .tarjeta-sola { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
        .tarjeta-sola figure { margin: 0; width: min(560px, 100%); }
        .tarjeta-svg { width: 100%; display: block; box-shadow: 0 1px 2px rgba(40,30,20,.2), 0 30px 60px -20px rgba(50,36,22,.45); }
        .tarjeta-sola figcaption { margin-top: 18px; text-align: center; font-family: var(--sans); font-weight: 500; color: var(--tinta); font-size: 18px; }
        @media print { body { background: #fff; } .tarjeta-svg { box-shadow: none; } .tarjeta-sola { padding: 0; } }
      `}</style>
    </div>
  );
}
