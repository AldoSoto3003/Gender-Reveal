import type { MiPrediccion, Prediccion } from '../../lib/types';

/**
 * La lista pública no dice de qué dispositivo es cada voto, así que "tu" voto se reconoce
 * por nombre y predicción a la vez, y solo se marca uno (el más reciente) aunque haya homónimos.
 */
function idPropio(predicciones: Prediccion[], mia: MiPrediccion | null): string | null {
  if (!mia) return null;
  const nombre = mia.nombre.trim().toLowerCase();
  const propias = predicciones.filter((p) => p.prediccion === mia.prediccion && p.nombre.trim().toLowerCase() === nombre);
  if (!propias.length) return null;
  return propias.reduce((a, b) => (Date.parse(b.creado_en) > Date.parse(a.creado_en) ? b : a)).id;
}

export function Conteo({ predicciones, mia }: { predicciones: Prediccion[]; mia: MiPrediccion | null }) {
  const ninas = predicciones.filter((p) => p.prediccion === 'nina');
  const ninos = predicciones.filter((p) => p.prediccion === 'nino');
  const total = predicciones.length;
  const pctNina = total ? Math.round((ninas.length / total) * 100) : 50;
  const pctNino = total ? 100 - pctNina : 50;
  const mio = idPropio(predicciones, mia);

  const lista = (ps: Prediccion[], lado: string) => (
    <ul className={`chips ${lado}`}>
      {ps.map((p) => (
        <li key={p.id} className={p.id === mio ? 'tu' : undefined}>
          {p.nombre}
        </li>
      ))}
    </ul>
  );

  return (
    <section className="sec" aria-labelledby="h-conteo">
      <div className="wrap">
        <div className="sec-cab">
          <div>
            <span className="tag">En vivo</span>
            <h2 className="h2" id="h-conteo">
              Así van las predicciones
            </h2>
          </div>
          <p>
            {total === 0
              ? 'Todavía nadie vota. ¡Sé la primera persona!'
              : `${total} ${total === 1 ? 'persona ha votado' : 'personas han votado'}. Tu nombre aparece resaltado cuando votes.`}
          </p>
        </div>
        {total > 0 && (
          <>
            <div className="marcador">
              <div className="lado">
                <div className="pct pct-nina">{pctNina}%</div>
                <p className="lado-l">Cree que es niña</p>
              </div>
              <div className="lado">
                <div className="pct pct-nino">{pctNino}%</div>
                <p className="lado-l">Cree que es niño</p>
              </div>
            </div>
            <div className="carril" role="img" aria-label={`${pctNina}% cree que es niña y ${pctNino}% cree que es niño`}>
              <div className="c-nina" style={{ flexBasis: `${pctNina}%` }} />
              <div className="c-nino" style={{ flexBasis: `${pctNino}%` }} />
            </div>
            <div className="equipos">
              <div className="lado">
                <h3>Team niña · {ninas.length}</h3>
                {lista(ninas, 'nina')}
              </div>
              <div className="lado">
                <h3>Team niño · {ninos.length}</h3>
                {lista(ninos, 'nino')}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
