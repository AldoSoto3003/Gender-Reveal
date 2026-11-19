import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api, mensajeError } from '../lib/api';
import { fechaLarga } from '../lib/formato';
import type { GuardianInfo, Sexo } from '../lib/types';
import '../styles/panel.css';

type Paso = 'pin' | 'elegir' | 'confirmar' | 'listo';

export function Guardian() {
  const { token = '' } = useParams();
  const [info, setInfo] = useState<GuardianInfo | null | undefined>(undefined);
  const [pin, setPin] = useState('');
  const [paso, setPaso] = useState<Paso>('pin');
  const [eleccion, setEleccion] = useState<Sexo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    document.title = 'Guardián del sobre';
    api
      .guardianInfo(token)
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [token]);

  async function sellar() {
    if (!eleccion) return;
    setEnviando(true);
    setError(null);
    try {
      await api.sellar(token, pin, eleccion);
      setPaso('listo');
    } catch (e) {
      const m = mensajeError(e);
      setError(m);
      if (/PIN/i.test(m)) setPaso('pin');
    } finally {
      setEnviando(false);
    }
  }

  function continuar(e: FormEvent) {
    e.preventDefault();
    if (/^\d{4}$/.test(pin)) setPaso('elegir');
  }

  const contenido = () => {
    if (info === undefined) return <p className="lede">Cargando…</p>;
    if (info === null) return <p className="lede">Este link no es válido. Pide a los papás que te manden uno nuevo.</p>;
    if (info.revelado) return <p className="lede">El resultado ya se reveló. ¡Gracias por guardar el secreto!</p>;
    if (paso === 'listo')
      return (
        <div role="status">
          <p className="lede">
            <strong>Resultado sellado.</strong> No se lo digas a nadie: se revelará el {fechaLarga(info.fecha_hora).toLowerCase()}.
          </p>
          <p className="muted">Ya puedes cerrar esta página. Por seguridad, no se vuelve a mostrar lo que elegiste.</p>
        </div>
      );

    return (
      <>
        <p className="lede">
          Eres la única persona que sabe el resultado. Aquí lo guardas para que los papás lo revelen en la fiesta sin verlo antes.
        </p>
        {info.sellado && paso === 'pin' && (
          <p className="muted" style={{ marginTop: 12 }}>
            Ya habías sellado un resultado. Si capturas otro, reemplaza al anterior (se puede hasta 24 horas antes del evento).
          </p>
        )}

        {paso === 'pin' && (
          <form onSubmit={continuar} style={{ marginTop: 20 }}>
            <div className="field">
              <label htmlFor="pin">PIN de 4 dígitos</label>
              <input
                id="pin"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button type="submit" className="btn" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} disabled={pin.length !== 4}>
              Continuar
            </button>
          </form>
        )}

        {paso === 'elegir' && (
          <div style={{ marginTop: 20 }}>
            <p className="h3">¿Qué dice el sobre del doctor?</p>
            <div className="g-opts" role="group" aria-label="Resultado">
              <button type="button" className={`g-opt g-nina${eleccion === 'nina' ? ' on' : ''}`} aria-pressed={eleccion === 'nina'} onClick={() => setEleccion('nina')}>
                Niña
              </button>
              <button type="button" className={`g-opt g-nino${eleccion === 'nino' ? ' on' : ''}`} aria-pressed={eleccion === 'nino'} onClick={() => setEleccion('nino')}>
                Niño
              </button>
            </div>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
              disabled={!eleccion}
              onClick={() => setPaso('confirmar')}
            >
              Continuar
            </button>
          </div>
        )}

        {paso === 'confirmar' && eleccion && (
          <div className="confirm" style={{ marginTop: 20 }}>
            <p>
              Vas a sellar: <strong>{eleccion === 'nina' ? 'NIÑA' : 'NIÑO'}</strong>. ¿Es correcto?
            </p>
            <div className="chips" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn" disabled={enviando} onClick={() => void sellar()}>
                {enviando ? 'Sellando…' : 'Sí, sellar'}
              </button>
              <button type="button" className="btn btn-o" disabled={enviando} onClick={() => setPaso('elegir')}>
                Corregir
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="err" role="alert">
            {error}
          </p>
        )}
      </>
    );
  };

  return (
    <div className="login">
      <div className="card login-card">
        <span className="seal-ic" aria-hidden="true">
          ?
        </span>
        <h1 className="h1" style={{ marginTop: 14 }}>
          Guardián del sobre
        </h1>
        {contenido()}
      </div>
    </div>
  );
}
