import { diaMes, hora, palabra, titulo } from '../../lib/formato';
import type { Evento, MiPrediccion, Prediccion } from '../../lib/types';

interface Props {
  evento: Evento;
  predicciones: Prediccion[];
  mia: MiPrediccion | null;
}

export function Revelacion({ evento, predicciones, mia }: Props) {
  const r = evento.estado === 'revelado' ? evento.resultado : null;
  const aciertos = r ? predicciones.filter((p) => p.prediccion === r) : [];

  return (
    <section className="rv" id="revelacion" aria-labelledby="h-rv">
      <div className="wrap">
        {!r ? (
          <>
            <span className="tag">El gran momento</span>
            <h2 className="h2" id="h-rv">
              El {diaMes(evento.fecha_hora)} abrimos el sobre
            </h2>
            <p className="sub">
              A las {hora(evento.fecha_hora)} lo abriremos frente a todos, y en ese mismo momento esta página mostrará el resultado en
              cada pantalla. Si no puedes ir, déjala abierta.
            </p>
          </>
        ) : (
          <div role="status">
            <span className="tag">El resultado</span>
            <h2 className="sr-only" id="h-rv">
              El resultado
            </h2>
            <p className={`rv-t ${r === 'nina' ? 'pct-nina' : 'pct-nino'}`}>{titulo(r)}</p>
            <p className="rv-h">
              {aciertos.length} de {predicciones.length} acertaron
            </p>
            {aciertos.length > 0 && <p className="rv-n">{aciertos.map((p) => p.nombre).join(', ')}</p>}
            {mia && (
              <p className="rv-y">
                {mia.prediccion === r ? `¡Acertaste, ${mia.nombre}!` : `Esta vez no, ${mia.nombre}. Dijiste ${palabra(mia.prediccion)}.`}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
