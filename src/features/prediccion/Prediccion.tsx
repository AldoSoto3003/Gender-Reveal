import { useEffect, useState, type FormEvent } from 'react';
import { api, mensajeError } from '../../lib/api';
import { palabra } from '../../lib/formato';
import type { Evento, MiPrediccion, Sexo } from '../../lib/types';
import { Globo } from '../../ui/Globo';
import { NINA, NINO } from '../../ui/SvgDefs';

interface Props {
  evento: Evento;
  mia: MiPrediccion | null;
  onCambio: (p: MiPrediccion | null) => void;
}

function Palomita() {
  return (
    <span className="tick" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

  const opciones: { s: Sexo; color: string; texto: string }[] = [
    { s: 'nina', color: NINA, texto: 'Niña' },
    { s: 'nino', color: NINO, texto: 'Niño' },
  ];

  return (
    <section className="sec" id="votar" aria-labelledby="h-voto">
      <div className="wrap">
        <div className="sec-cab">
          <div>
            <span className="tag">Tu predicción</span>
            <h2 className="h2" id="h-voto">
              ¿Qué crees que será?
            </h2>
          </div>
          <p>Elige un globo. Las predicciones se cierran cuando empiece la fiesta.</p>
        </div>

        {cerrado ? (
          <p className="vacio">Las predicciones ya se cerraron. ¡Gracias a todos por participar!</p>
        ) : mia && !editando ? (
          <div className="gracias" role="status">
            <h3>¡Gracias, {mia.nombre}!</h3>
            <span className={`chip-voto ${mia.prediccion}`}>
              <i aria-hidden="true" />
              Tu predicción: {palabra(mia.prediccion)}
            </span>
            <p>
              Apostaste por {palabra(mia.prediccion)}
              {mia.peso_kg ? ` y un peso de ${mia.peso_kg} kg` : ''}. El día de la fiesta sabrás si acertaste.
            </p>
            <button type="button" className="btn btn-o" onClick={() => setEditando(true)}>
              Cambiar mi predicción
            </button>
          </div>
        ) : (
          <form className="voto" onSubmit={enviar} noValidate>
            <div className={`elige${eleccion ? ' elegido' : ''}`} role="group" aria-label="Tu predicción">
              {opciones.map((o) => (
                <button
                  key={o.s}
                  type="button"
                  className={`opcion ${o.s}`}
                  aria-pressed={eleccion === o.s}
                  onClick={() => setEleccion(o.s)}
                >
                  {eleccion === o.s && <Palomita />}
                  <Globo color={o.color} hilos={false} />
                  <strong>{o.texto}</strong>
                  <small>Team {palabra(o.s)}</small>
                </button>
              ))}
            </div>
            <div className="form">
              <div className="campo">
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
              </div>
              <div className="campo">
                <label className="lbl" htmlFor="kg">
                  Peso al nacer (opcional)
                </label>
                <input
                  className="in"
                  id="kg"
                  type="text"
                  inputMode="decimal"
                  placeholder="Por ejemplo, 3.2 kg"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                />
              </div>
              <div className="fila-envio">
                <button type="submit" className="btn" disabled={!listo || enviando}>
                  {enviando ? 'Enviando…' : 'Enviar mi predicción'}
                </button>
                {mia && (
                  <button type="button" className="lnk" onClick={() => setEditando(false)}>
                    Dejarla como estaba
                  </button>
                )}
              </div>
              {error ? (
                <p className="err" role="alert">
                  {error}
                </p>
              ) : (
                <p className="pista">{pista}</p>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
