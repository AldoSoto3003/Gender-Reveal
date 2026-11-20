import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, mensajeError } from '../lib/api';
import { usePanel } from '../features/panel/usePanel';
import { Confirmaciones, DatosEvento, Historia, LaRevelacion, Recuerdos, Resumen } from '../features/panel/Secciones';
import '../styles/panel.css';

type Tab = 'resumen' | 'rsvp' | 'evento' | 'hist' | 'mem' | 'rev';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'resumen', label: 'Resumen', icon: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z' },
  { id: 'rsvp', label: 'Confirmaciones', icon: 'M16 11a4 4 0 1 0-8 0M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6' },
  { id: 'evento', label: 'Datos del evento', icon: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z' },
  { id: 'hist', label: 'Nuestra historia', icon: 'M4 5h16v14H4zM4 15l5-4 4 3 3-2 4 3' },
  { id: 'mem', label: 'Recuerdos del día', icon: 'M3 8h4l2-3h6l2 3h4v11H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { id: 'rev', label: 'La revelación', icon: 'M4 8h16v12H4zM2 5h20v3H2zM12 5v15' },
];

function Globito() {
  return (
    <svg width="36" height="46" viewBox="0 0 60 78" aria-hidden="true">
      <path d="M30 2C47 2 57 17 57 34C57 53 43 66 30 68C17 66 3 53 3 34C3 17 13 2 30 2Z" fill="#E3B23C" />
      <path d="M26 74L34 74L30 67Z" fill="#E3B23C" />
      <ellipse cx="19" cy="22" rx="5" ry="9" fill="#FFFFFF" opacity="0.6" transform="rotate(-25 19 22)" />
    </svg>
  );
}

function Entrar() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.entrar(email.trim());
      setEnviado(true);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <div className="card login-card">
        <Globito />
        <h1 className="h1">Panel de los papás</h1>
        {enviado ? (
          <p className="lede" role="status">
            Te mandamos un link a <strong>{email}</strong>. Ábrelo desde este mismo dispositivo para entrar.
          </p>
        ) : (
          <form onSubmit={enviar}>
            <p className="lede">Escribe tu correo y te mandamos un link para entrar, sin contraseña.</p>
            <div className="field" style={{ marginTop: 20 }}>
              <label htmlFor="email">Correo</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} disabled={enviando || !email}>
              {enviando ? 'Enviando…' : 'Mandarme el link'}
            </button>
            {error && (
              <p className="err" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export function Panel() {
  const [sesion, setSesion] = useState<{ email: string; admin: boolean } | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('resumen');
  const [toast, setToast] = useState<string | null>(null);

  const revisar = useCallback(() => {
    api
      .sesion()
      .then(setSesion)
      .catch(() => setSesion(null));
  }, []);

  useEffect(() => {
    revisar();
    return api.alCambiarSesion(revisar);
  }, [revisar]);

  const admin = !!sesion?.admin;
  const datos = usePanel(admin);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    document.title = 'Panel de los papás';
  }, []);

  if (sesion === undefined) return <div className="pn-cargando">Cargando…</div>;
  if (!sesion) return <Entrar />;
  if (!sesion.admin) {
    return (
      <div className="login">
        <div className="card login-card">
          <Globito />
          <h1 className="h1">Casi listo</h1>
          <p className="lede">
            Entraste como <strong>{sesion.email}</strong>, pero este correo todavía no está dado de alta como papá o mamá del evento.
          </p>
          <p className="muted">Pide que lo agreguen a la tabla de admins (ver docs/03-modelo-de-datos.md).</p>
          <button type="button" className="btn btn-o" onClick={() => void api.salir()}>
            Salir
          </button>
        </div>
      </div>
    );
  }

  const pendientes = datos.recuerdos.filter((r) => r.estado === 'pendiente').length;
  const props = { d: datos, recargar: datos.recargar, avisar: setToast };

  return (
    <div className="pn">
      <aside className="side">
        <div className="brand">
          <Globito />
          <div>
            <p className="brand-t">Panel de los papás</p>
            <p className="brand-s">{api.modo === 'demo' ? 'Modo demo' : 'Solo ustedes ven esto'}</p>
          </div>
        </div>
        <nav className="nav" aria-label="Secciones del panel">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`tab${tab === t.id ? ' on' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={t.icon} />
              </svg>
              <span>{t.label}</span>
              {t.id === 'rsvp' && datos.asistencias.length > 0 && <span className="badge">{datos.asistencias.length}</span>}
              {t.id === 'mem' && pendientes > 0 && <span className="badge">{pendientes}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <a href="/" target="_blank" rel="noopener noreferrer">
            Ver la invitación
          </a>
          <br />
          <a href="/tarjeta" target="_blank" rel="noopener noreferrer">
            Tarjeta para WhatsApp
          </a>
          {api.modo === 'supabase' && (
            <>
              <br />
              <button type="button" className="side-out" onClick={() => void api.salir()}>
                Salir ({sesion.email})
              </button>
            </>
          )}
        </div>
      </aside>
      <main className="body">
        {!datos.evento ? (
          <p className="muted">Cargando datos…</p>
        ) : (
          <>
            {tab === 'resumen' && <Resumen d={datos} irA={(t) => setTab(t as Tab)} />}
            {tab === 'rsvp' && <Confirmaciones d={datos} avisar={setToast} />}
            {tab === 'evento' && <DatosEvento {...props} />}
            {tab === 'hist' && <Historia {...props} />}
            {tab === 'mem' && <Recuerdos {...props} />}
            {tab === 'rev' && <LaRevelacion {...props} />}
          </>
        )}
      </main>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
