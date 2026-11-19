import type { Prediccion } from '../../lib/types';

export function Conteo({ predicciones, miNombre }: { predicciones: Prediccion[]; miNombre?: string }) {
  const ninas = predicciones.filter((p) => p.prediccion === 'nina');
  const ninos = predicciones.filter((p) => p.prediccion === 'nino');
  const total = predicciones.length;
  const pctNina = total ? Math.round((ninas.length / total) * 100) : 50;
  const pctNino = total ? 100 - pctNina : 50;

  const lista = (ps: Prediccion[]) =>
    ps.map((p) => (
      <li key={p.id} className={miNombre && p.nombre === miNombre ? 'new' : ''}>
        {p.nombre}
      </li>
    ));

  return (
    <section className="sec" aria-labelledby="h-conteo">
      <div className="wrap">
        <h2 className="h2" id="h-conteo">
          Así van las predicciones
        </h2>
        {total === 0 ? (
          <p className="sub">Todavía nadie vota. ¡Sé la primera persona!</p>
        ) : (
          <>
            <div className="tally">
              <div className="tally-side">
                <div className="pct pct-g">{pctNina}%</div>
                <div className="pct-l">Niña</div>
              </div>
              <div className="foil" aria-hidden="true" />
              <div className="tally-side">
                <div className="pct pct-b">{pctNino}%</div>
                <div className="pct-l">Niño</div>
              </div>
            </div>
            <div className="lane" role="img" aria-label={`${pctNina}% cree que es niña y ${pctNino}% cree que es niño`}>
              <div className="lane-g" style={{ width: `${pctNina}%` }} />
              <div className="lane-b" style={{ width: `${pctNino}%` }} />
            </div>
            <div className="who">
              <div>
                <p className="who-h">Team niña, {ninas.length}</p>
                <ul>{lista(ninas)}</ul>
              </div>
              <div>
                <p className="who-h">Team niño, {ninos.length}</p>
                <ul>{lista(ninos)}</ul>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
