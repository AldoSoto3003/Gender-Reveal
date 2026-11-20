import { useEffect, useState, type FormEvent } from 'react';
import { api, mensajeError } from '../../lib/api';
import { fechaLarga, hora, partesFecha } from '../../lib/formato';
import { appleMaps, googleMaps } from '../../lib/mapas';
import type { Evento, MiAsistencia, Respuesta } from '../../lib/types';

const ICONOS = {
  cal: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  nota: <path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3" />,
};

function Icono({ n }: { n: keyof typeof ICONOS }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONOS[n]}
    </svg>
  );
}

function Dato({ icono, k, v, pendiente }: { icono: keyof typeof ICONOS; k: string; v: string; pendiente?: boolean }) {
  return (
    <li>
      <span className="dato-ico">
        <Icono n={icono} />
      </span>
      <div>
        <p className="dato-k">{k}</p>
        <p className={`dato-v${pendiente ? ' pend' : ''}`}>{v}</p>
      </div>
    </li>
  );
}

const OPCIONES: { valor: Respuesta; texto: string; icono: string }[] = [
  { valor: 'si', texto: 'Sí, ahí estaré', icono: 'M5 12.5l4.5 4.5L19 7.5' },
  { valor: 'tal_vez', texto: 'Aún no lo sé', icono: 'M9.2 9a3 3 0 1 1 4.3 2.7c-.9.4-1.5 1.2-1.5 2.2v.6M12 18h.01' },
  { valor: 'no', texto: 'No podré ir', icono: 'M7 7l10 10M17 7L7 17' },
];

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function Contador({ etiqueta, ayuda, valor, onCambio }: { etiqueta: string; ayuda: string; valor: number; onCambio: (n: number) => void }) {
  return (
    <div className="contador">
      <div>
        <span className="contador-t">{etiqueta}</span>
        <span className="contador-a">{ayuda}</span>
      </div>
      <div className="paso">
        <button type="button" aria-label={`${etiqueta}: uno menos`} disabled={valor <= 0} onClick={() => onCambio(Math.max(0, valor - 1))}>
          −
        </button>
        <span className="paso-n" aria-live="polite" aria-label={`${etiqueta}: ${valor}`}>
          {valor}
        </span>
        <button type="button" aria-label={`${etiqueta}: uno más`} disabled={valor >= 10} onClick={() => onCambio(Math.min(10, valor + 1))}>
          +
        </button>
      </div>
    </div>
  );
}

/** "tú, 1 adulto y 2 niños" */
export function desglose(adultos: number, ninos: number): string {
  const partes = ['tú'];
  if (adultos) partes.push(plural(adultos, 'adulto', 'adultos'));
  if (ninos) partes.push(plural(ninos, 'niño', 'niños'));
  return partes.length === 1 ? 'solo tú' : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

function mensajeListo(a: MiAsistencia): string {
  const gente = `${plural(a.personas, 'persona', 'personas')} (${desglose(a.adultos, a.ninos)})`;
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
  // Si la persona ya escribió (o borró) su nombre aquí, no se lo volvemos a sugerir.
  const [nombreTocado, setNombreTocado] = useState(false);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [adultos, setAdultos] = useState(0);
  const [ninos, setNinos] = useState(0);
  const [acompanantes, setAcompanantes] = useState('');
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
    if (!nombreTocado && nombreSugerido) setNombre(nombreSugerido);
  }, [nombreSugerido, nombreTocado]);

  function empezarEdicion() {
    if (mia) {
      setNombreTocado(true);
      setNombre(mia.nombre);
      setRespuesta(mia.respuesta);
      setAdultos(mia.adultos);
      setNinos(mia.ninos);
      setAcompanantes(mia.acompanantes);
      setMensaje(mia.mensaje);
    }
    setEditando(true);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !respuesta) return;
    const viene = respuesta !== 'no';
    const datos: MiAsistencia = {
      nombre: nombre.trim(),
      respuesta,
      adultos: viene ? adultos : 0,
      ninos: viene ? ninos : 0,
      acompanantes: viene ? acompanantes.trim() : '',
      personas: viene ? 1 + adultos + ninos : 0,
      mensaje: mensaje.trim(),
    };
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
  const f = partesFecha(evento.fecha_hora);
  const pista = !nombre.trim() ? 'Escribe tu nombre.' : !respuesta ? 'Dinos si vienes.' : '';

  return (
    <>
    <section className="sec" id="detalles" aria-labelledby="h-det">
      <div className="wrap">
        <div className="sec-cab">
          <div>
            <span className="tag">Apunta la fecha</span>
            <h2 className="h2" id="h-det">
              Los detalles
            </h2>
          </div>
          <p>Todo lo que necesitas para llegar. Si algo cambia, lo verás aquí primero.</p>
        </div>

        <div className="detalles">
          <div className="fecha-grande" aria-hidden="true">
            <span className="fg-dia">{f.dia}</span>
            <span className="fg-mes">{f.mes}</span>
            <span className="fg-resto">
              {f.semana} · {f.anio}
            </span>
          </div>
          <div>
            <ul className="datos">
              <Dato icono="cal" k="Cuándo" v={fechaLarga(evento.fecha_hora)} />
              <Dato icono="reloj" k="Hora" v={`${hora(evento.fecha_hora)} (hora de Tijuana)`} />
              <Dato icono="pin" k="Dónde" v={evento.lugar || 'Lugar por confirmar'} pendiente={!evento.lugar} />
              {evento.direccion && <Dato icono="pin" k="Dirección" v={evento.direccion} />}
              {evento.nota && <Dato icono="nota" k="Nota" v={evento.nota} />}
            </ul>
            {evento.direccion ? (
              <div className="mapas">
                <a className="btn btn-o" href={googleMaps(evento.direccion)} target="_blank" rel="noopener noreferrer">
                  <Icono n="pin" />
                  Google Maps
                </a>
                <a className="btn btn-o" href={appleMaps(evento.direccion)} target="_blank" rel="noopener noreferrer">
                  <Icono n="pin" />
                  Apple Maps
                </a>
              </div>
            ) : (
              <p className="nota-mapa">Los botones para abrir el mapa aparecerán aquí en cuanto confirmemos el lugar.</p>
            )}
          </div>
        </div>
      </div>
    </section>

    <section className="rsvp-banda" id="confirmar" aria-labelledby="h-rsvp">
      <div className="wrap">
        <div className="rsvp">
          <div className="rsvp-intro">
            <span className="tag">Lo más importante</span>
            <h2 className="h2" id="h-rsvp">
              ¿Nos acompañas?
            </h2>
            <p>Confírmanos si vienes y con cuántas personas. Nos ayuda a preparar lugar y comida para todos, y puedes cambiar tu respuesta cuando quieras.</p>
            {evento.telefono && (
              <p className="rnote">
                ¿Prefieres confirmar por teléfono? Llama o escribe al{' '}
                <a href={`tel:${evento.telefono.replace(/[^\d+]/g, '')}`}>{evento.telefono}</a>.
              </p>
            )}
          </div>

          <div>
            {mostrarForm && (
              <form className="form" onSubmit={enviar} noValidate>
                <div className="campo">
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
                    onChange={(e) => {
                      setNombreTocado(true);
                      setNombre(e.target.value);
                    }}
                  />
                </div>
                <div className="campo">
                  <span className="lbl" id="lbl-vienes">
                    ¿Vienes a la fiesta?
                  </span>
                  <div className="vienes" role="group" aria-labelledby="lbl-vienes">
                    {OPCIONES.map((o) => (
                      <button key={o.valor} type="button" className={`vienes-op ${o.valor}`} aria-pressed={respuesta === o.valor} onClick={() => setRespuesta(o.valor)}>
                        <span className="vienes-ico" aria-hidden="true">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d={o.icono} />
                          </svg>
                        </span>
                        {o.texto}
                      </button>
                    ))}
                  </div>
                </div>
                {respuesta && respuesta !== 'no' && (
                  <fieldset className="acomp">
                    <legend className="lbl">{respuesta === 'si' ? '¿Quién viene contigo?' : '¿Quién vendría contigo?'}</legend>
                    <Contador etiqueta="Adultos" ayuda="Además de ti, por ejemplo tu pareja" valor={adultos} onCambio={setAdultos} />
                    <Contador etiqueta="Niños" ayuda="Bebés y niños de cualquier edad" valor={ninos} onCambio={setNinos} />
                    {adultos + ninos > 0 && (
                      <div className="campo acomp-nombres">
                        <label className="lbl" htmlFor="ra">
                          Sus nombres (opcional)
                        </label>
                        <input
                          className="in"
                          id="ra"
                          type="text"
                          maxLength={300}
                          placeholder="Por ejemplo, Ana, Pablo y Lucía"
                          value={acompanantes}
                          onChange={(e) => setAcompanantes(e.target.value)}
                        />
                      </div>
                    )}
                    <p className="acomp-total" aria-live="polite">
                      Total: <strong>{1 + adultos + ninos}</strong> {1 + adultos + ninos === 1 ? 'persona' : 'personas'} ({desglose(adultos, ninos)})
                    </p>
                  </fieldset>
                )}
                <div className="campo">
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
                <div className="fila-envio">
                  <button type="submit" className="btn btn-grande" disabled={!nombre.trim() || !respuesta || enviando}>
                    {enviando ? 'Enviando…' : 'Enviar confirmación'}
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
              </form>
            )}

            {cargada && mia && !editando && (
              <div className="listo" role="status">
                <span className="listo-ok" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <p>{mensajeListo(mia)}</p>
                {mia.acompanantes && <p className="vacio">Con: {mia.acompanantes}</p>}
                <button type="button" className="btn btn-o" onClick={empezarEdicion}>
                  Cambiar mi respuesta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
