import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { diaMes } from '../../lib/formato';
import { api, mensajeError } from '../../lib/api';
import { reducirFoto } from '../../lib/imagen';
import type { Evento, FotoRecuerdo } from '../../lib/types';

interface Props {
  evento: Evento;
  fotos: FotoRecuerdo[];
  nombreSugerido?: string;
}

export function Recuerdos({ evento, fotos, nombreSugerido }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState(nombreSugerido ?? '');
  const [nombreTocado, setNombreTocado] = useState(false);
  const dia = diaMes(evento.fecha_hora);

  // La predicción puede llegar o cambiar después de montar la sección.
  useEffect(() => {
    if (!nombreTocado && nombreSugerido) setNombre(nombreSugerido);
  }, [nombreSugerido, nombreTocado]);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function elegir(e: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []).slice(0, 10);
    e.target.value = '';
    if (!archivos.length) return;
    setError(null);
    setAviso(null);
    try {
      for (let i = 0; i < archivos.length; i++) {
        setSubiendo(`Subiendo ${i + 1} de ${archivos.length}…`);
        await api.subirRecuerdo(await reducirFoto(archivos[i]), nombre.trim() || 'Invitado');
      }
      setAviso(
        archivos.length === 1
          ? '¡Gracias! Tu foto aparecerá en cuanto los papás la aprueben.'
          : `¡Gracias! Tus ${archivos.length} fotos aparecerán en cuanto los papás las aprueben.`,
      );
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setSubiendo(null);
    }
  }

  return (
    <section className="sec" id="recuerdos" aria-labelledby="h-mem">
      <div className="wrap">
        <div className="sec-cab">
          <div>
            <span className="tag">{evento.galeria_visible ? 'Galería' : 'Después de la fiesta'}</span>
            <h2 className="h2" id="h-mem">
              Recuerdos del {dia}
            </h2>
          </div>
          <p>
            {evento.galeria_visible
              ? 'Fotos de la familia y de los invitados. Sube las tuyas para que todos las vean.'
              : 'Aquí estarán todas las fotos de la fiesta. Tú también podrás subir las que tomes.'}
          </p>
        </div>

        {!evento.galeria_visible ? (
          <>
            <div className="mem-lock">
              <div aria-hidden="true" />
              <div>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <p>Se abre el {dia}</p>
              </div>
              <div aria-hidden="true" />
            </div>
          </>
        ) : (
          <>
            {evento.invitados_suben_fotos && (
              <div className="upload">
                <div className="campo">
                  <label className="lbl" htmlFor="mn">
                    Tu nombre
                  </label>
                  <input
                    className="in"
                    id="mn"
                    type="text"
                    maxLength={60}
                    placeholder="Para saber quién la tomó"
                    value={nombre}
                    onChange={(e) => {
                      setNombreTocado(true);
                      setNombre(e.target.value);
                    }}
                  />
                </div>
                <input ref={input} type="file" accept="image/*" multiple hidden onChange={elegir} />
                <div className="fila-envio">
                  <button type="button" className="btn" disabled={!!subiendo} onClick={() => input.current?.click()}>
                    {subiendo ?? 'Subir mis fotos'}
                  </button>
                  {aviso && (
                    <p className="hint2" role="status">
                      {aviso}
                    </p>
                  )}
                  {error && (
                    <p className="err" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            )}
            {fotos.length === 0 ? (
              <p className="vacio">Todavía no hay fotos publicadas.</p>
            ) : (
              <div className="mem-grid">
                {fotos.map((f) => (
                  <figure key={f.id} className="mem">
                    <img src={f.url} alt={`Foto de ${f.subida_por}`} loading="lazy" />
                    <figcaption>{f.subida_por}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
