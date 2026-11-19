import { useEffect, useState, type FormEvent } from 'react';
import { api, mensajeError } from '../../lib/api';
import { palabra } from '../../lib/formato';
import type { Evento, MiPrediccion, Sexo } from '../../lib/types';
import { Globo } from '../../ui/Globo';
import { AZUL, ROSA } from '../../ui/SvgDefs';

interface Props {
  evento: Evento;
  mia: MiPrediccion | null;
  onCambio: (p: MiPrediccion | null) => void;
}

function Palomita() {
  return (
    <span className="tick" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#FBF8F3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    </span>
  );
}

export function Prediccion({ evento, mia, onCambio }: Props) {
  const [nombre, setNombre] = useState('');
  const [eleccion, setEleccion] = useState<Sexo | null>(null);
  const [peso, setPeso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (mia && editando) {
      setNombre(mia.nombre);
      setEleccion(mia.prediccion);
      setPeso(mia.peso_kg ? String(mia.peso_kg) : '');
    }
  }, [mia, editando]);

  const cerrado = evento.estado !== 'pendiente';
  const listo = nombre.trim().length > 0 && eleccion !== null;
  const pista = !nombre.trim() ? 'Escribe tu nombre.' : !eleccion ? 'Toca el globo de tu predicción.' : '';

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!listo || !eleccion) return;
    const kg = peso.trim() ? Number(peso.replace(',', '.').replace(/[^\d.]/g, '')) : null;
    if (kg !== null && (Number.isNaN(kg) || kg < 1 || kg > 6)) {
      setError('El peso debe estar entre 1 y 6 kg.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await api.guardarPrediccion(nombre.trim(), eleccion, kg);
      onCambio({ nombre: nombre.trim(), prediccion: eleccion, peso_kg: kg });
      setEditando(false);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  const clase = (s: Sexo) => (eleccion === s ? 'bb on' : eleccion ? 'bb off' : 'bb');

  return (
    <section className="sec" id="votar" aria-labelledby="h-voto">
      <div className="wrap">
        <h2 className="h2" id="h-voto">
          ¿Qué crees que será?
        </h2>

        {cerrado ? (
          <p className="sub">Las predicciones ya se cerraron. ¡Gracias a todos por participar!</p>
        ) : mia && !editando ? (
          <div className="thanks" role="status">
            <p className="thanks-t">¡Gracias, {mia.nombre}!</p>
            <p className="sub">Tu predicción: {palabra(mia.prediccion)}. El día de la fiesta sabrás si acertaste.</p>
            <div className="center">
              <button type="button" className="btn btn-o" onClick={() => setEditando(true)}>
                Cambiar mi predicción
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="sub">Elige un globo. Las predicciones se cierran cuando empiece la fiesta.</p>
            <form className="form" onSubmit={enviar}>
              <label className="lbl" htmlFor="nm">
                Tu nombre
              </label>
              <input
                className="in"
                id="nm"
                type="text"
                autoComplete="name"
                maxLength={60}
                placeholder="Nombre y apellido"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <div className="pick" role="group" aria-label="Tu predicción">
                <button type="button" className={clase('nina')} aria-pressed={eleccion === 'nina'} aria-label="Niña" onClick={() => setEleccion('nina')}>
                  <Globo color={ROSA} texto="NIÑA" colorTexto="#C0504A" />
                  {eleccion === 'nina' && <Palomita />}
                </button>
                <button type="button" className={clase('nino')} aria-pressed={eleccion === 'nino'} aria-label="Niño" onClick={() => setEleccion('nino')}>
                  <Globo color={AZUL} texto="NIÑO" colorTexto="#34507A" />
                  {eleccion === 'nino' && <Palomita />}
                </button>
              </div>
              <div className="opt-row">
                <div className="kg">
                  <label className="lbl" htmlFor="kg">
                    Peso al nacer (opcional)
                  </label>
                  <input className="in" id="kg" type="text" inputMode="decimal" placeholder="3.2 kg" value={peso} onChange={(e) => setPeso(e.target.value)} />
                </div>
              </div>
              <div className="center">
                <button type="submit" className="btn" disabled={!listo || enviando}>
                  {enviando ? 'Enviando…' : 'Enviar mi predicción'}
                </button>
                {error ? (
                  <p className="err" role="alert">
                    {error}
                  </p>
                ) : (
                  <p className="hint2">{pista}</p>
                )}
                {mia && (
                  <button type="button" className="lnk" onClick={() => setEditando(false)}>
                    Dejar mi predicción como estaba
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
