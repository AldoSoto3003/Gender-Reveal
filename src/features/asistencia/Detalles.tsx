import { useEffect, useState, type FormEvent } from 'react';
import { api, mensajeError } from '../../lib/api';
import { fechaLarga, hora } from '../../lib/formato';
import { appleMaps, googleMaps } from '../../lib/mapas';
import type { Evento, MiAsistencia, Respuesta } from '../../lib/types';

function Pin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

const OPCIONES: { valor: Respuesta; texto: string }[] = [
  { valor: 'si', texto: 'Sí, ahí estaré' },
  { valor: 'tal_vez', texto: 'Aún no lo sé' },
  { valor: 'no', texto: 'No podré ir' },
];

function mensajeListo(a: MiAsistencia): string {
  const gente = `${a.personas} ${a.personas === 1 ? 'persona' : 'personas'}`;
  if (a.respuesta === 'si') return `¡Listo, ${a.nombre}! Te esperamos. Confirmaste ${gente}.`;
  if (a.respuesta === 'tal_vez')
    return `Gracias, ${a.nombre}. Te apartamos lugar para ${gente}. Cuando lo sepas, vuelve aquí y cambia tu respuesta.`;
  return `Gracias por avisar, ${a.nombre}. Te vamos a extrañar.`;
}

export function Detalles({ evento, nombreSugerido }: { evento: Evento; nombreSugerido?: string }) {
  const [mia, setMia] = useState<MiAsistencia | null>(null);
  const [cargada, setCargada] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [personas, setPersonas] = useState(1);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .miAsistencia()
      .then((a) => setMia(a))
      .catch(() => setMia(null))
      .finally(() => setCargada(true));
  }, []);

  useEffect(() => {
    if (!nombre && nombreSugerido) setNombre(nombreSugerido);
  }, [nombreSugerido, nombre]);

  function empezarEdicion() {
    if (mia) {
      setNombre(mia.nombre);
      setRespuesta(mia.respuesta);
      setPersonas(Math.max(1, mia.personas));
      setMensaje(mia.mensaje);
    }
    setEditando(true);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !respuesta) return;
    const datos: MiAsistencia = { nombre: nombre.trim(), respuesta, personas: respuesta === 'no' ? 0 : personas, mensaje: mensaje.trim() };
    setEnviando(true);
    setError(null);
    try {
      await api.guardarAsistencia(datos);
      setMia(datos);
      setEditando(false);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  const mostrarForm = cargada && (!mia || editando);
  const pista = !nombre.trim() ? 'Escribe tu nombre.' : !respuesta ? 'Dinos si vienes.' : '';

  return (
    <section className="sec" id="detalles" aria-labelledby="h-det">
      <div className="wrap">
        <h2 className="h2" id="h-det">
          Los detalles
        </h2>
        <div className="dcard">
          <svg className="paper" aria-hidden="true">
            <rect width="100%" height="100%" filter="url(#paperLit)" />
          </svg>
          <div className="drow">
            <span className="dk">Cuándo</span>
            <span className="dv">{fechaLarga(evento.fecha_hora)}</span>
          </div>
          <div className="drow">
            <span className="dk">Hora</span>
            <span className="dv">{hora(evento.fecha_hora)}</span>
          </div>
          <div className="drow">
            <span className="dk">Dónde</span>
            <span className="dv">{evento.lugar || 'Por confirmar'}</span>
          </div>
          {evento.direccion && (
            <div className="drow">
              <span className="dk">Dirección</span>
              <span className="dv">{evento.direccion}</span>
            </div>
          )}
          {evento.nota && (
            <div className="drow">
              <span className="dk">Nota</span>
              <span className="dv">{evento.nota}</span>
            </div>
          )}

          {evento.direccion && (
            <div className="maps">
              <a className="btn btn-o" href={googleMaps(evento.direccion)} target="_blank" rel="noopener noreferrer">
                <Pin />
                Abrir en Google Maps
              </a>
              <a className="btn btn-o" href={appleMaps(evento.direccion)} target="_blank" rel="noopener noreferrer">
                <Pin />
                Abrir en Apple Maps
              </a>
            </div>
          )}

          <div className="rsvp" id="confirmar">
            <p className="dk rsvp-h">Confirma tu asistencia</p>

            {mostrarForm && (
              <form onSubmit={enviar}>
                <label className="lbl" htmlFor="rn">
                  Tu nombre
                </label>
                <input
                  className="in"
                  id="rn"
                  type="text"
                  autoComplete="name"
                  maxLength={60}
                  placeholder="Nombre y apellido"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                <div className="seg-row" role="group" aria-label="¿Vienes a la fiesta?">
                  {OPCIONES.map((o) => (
                    <button
                      key={o.valor}
                      type="button"
                      className={`seg${respuesta === o.valor ? ' on' : ''}`}
                      aria-pressed={respuesta === o.valor}
                      onClick={() => setRespuesta(o.valor)}
                    >
                      {o.texto}
                    </button>
                  ))}
                </div>
                {respuesta && respuesta !== 'no' && (
                  <div className="ppl">
                    <span className="lbl" style={{ margin: 0 }}>
                      {respuesta === 'si' ? '¿Cuántas personas vienen, contándote a ti?' : '¿Cuántas personas vendrían, contándote a ti?'}
                    </span>
                    <div className="step">
                      <button type="button" className="sb" aria-label="Una persona menos" disabled={personas <= 1} onClick={() => setPersonas((p) => Math.max(1, p - 1))}>
                        −
                      </button>
                      <span className="cnt" aria-live="polite">
                        {personas}
                      </span>
                      <button type="button" className="sb" aria-label="Una persona más" disabled={personas >= 8} onClick={() => setPersonas((p) => Math.min(8, p + 1))}>
                        +
                      </button>
                    </div>
                  </div>
                )}
                <div className="rsvp-msg">
                  <label className="lbl" htmlFor="rm">
                    Mensaje para los papás (opcional)
                  </label>
                  <input
                    className="in"
                    id="rm"
                    type="text"
                    maxLength={500}
                    placeholder="Unas palabras para ellos"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                  />
                </div>
                <div className="center">
                  <button type="submit" className="btn" disabled={!nombre.trim() || !respuesta || enviando}>
                    {enviando ? 'Enviando…' : 'Enviar confirmación'}
                  </button>
                  {error ? (
                    <p className="err" role="alert">
                      {error}
                    </p>
                  ) : (
                    <p className="hint2">{pista}</p>
                  )}
                </div>
              </form>
            )}

            {cargada && mia && !editando && (
              <div className="okay" role="status">
                <svg width="40" height="40" viewBox="0 0 34 34" fill="none" stroke="#4E5A6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="17" cy="17" r="15" strokeOpacity="0.3" />
                  <path d="M10 17.5l4.6 4.6L24.5 12" />
                </svg>
                <span>{mensajeListo(mia)}</span>
                <button type="button" className="lnk" onClick={empezarEdicion}>
                  Cambiar mi respuesta
                </button>
              </div>
            )}

            {evento.telefono && (
              <p className="rnote">
                ¿Prefieres confirmar por teléfono? Llama o escribe al <a href={`tel:${evento.telefono.replace(/\s/g, '')}`}>{evento.telefono}</a>.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
