import { useRef, useState, type ChangeEvent } from 'react';
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
        <h2 className="h2" id="h-mem">
          Recuerdos del 16 de enero
        </h2>

        {!evento.galeria_visible ? (
          <>
            <p className="sub">Después de la fiesta, aquí estarán todas las fotos del día. Tú también podrás subir las que tomes.</p>
            <div className="mem-lock" aria-hidden="true">
              <div className="pb pb1" />
              <div className="pb pb2" />
              <div className="pb pb3">
                <div className="pb-in">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#7A746D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
                <p className="pb-cap hand">Se abre el 16 de enero</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="sub">Fotos de la familia y de los invitados. Sube las tuyas para que todos las vean.</p>
            {evento.invitados_suben_fotos && (
              <div className="upload">
                <div className="upload-name">
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
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <input ref={input} type="file" accept="image/*" multiple hidden onChange={elegir} />
                <div className="center">
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
              <p className="demo">Todavía no hay fotos publicadas.</p>
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
