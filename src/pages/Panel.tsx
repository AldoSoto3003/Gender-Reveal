import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTema } from '../lib/tema';
import { api, mensajeError } from '../lib/api';
import { errorDelLink } from '../lib/errores';
import { usePanel } from '../features/panel/usePanel';
import { Confirmaciones, DatosEvento, Historia, LaRevelacion, Recuerdos, Resumen } from '../features/panel/Secciones';
import '../styles/panel.css';

type Tab = 'resumen' | 'rsvp' | 'evento' | 'hist' | 'mem' | 'rev';

const TABS: { id: Tab; label: string; corto: string; icon: string }[] = [
  { id: 'resumen', corto: 'Inicio', label: 'Resumen', icon: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z' },
  { id: 'rsvp', corto: 'Asistencia', label: 'Confirmaciones', icon: 'M16 11a4 4 0 1 0-8 0M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6' },
  { id: 'evento', corto: 'Evento', label: 'Datos del evento', icon: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z' },
  { id: 'hist', corto: 'Historia', label: 'Nuestra historia', icon: 'M4 5h16v14H4zM4 15l5-4 4 3 3-2 4 3' },
  { id: 'mem', corto: 'Fotos', label: 'Recuerdos del día', icon: 'M3 8h4l2-3h6l2 3h4v11H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { id: 'rev', corto: 'Revelar', label: 'La revelación', icon: 'M4 8h16v12H4zM2 5h20v3H2zM12 5v15' },
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

function Ojo({ abierto }: { abierto: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!abierto && <path d="M4 4l16 16" />}
    </svg>
  );
}

/** Campo de contraseña con botón para mostrarla. */
function CampoContrasena({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: 'current-password' | 'new-password';
}) {
  const [ver, setVer] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pass">
        <input id={id} type={ver ? 'text' : 'password'} autoComplete={autoComplete} required value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="pass-ver" aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={ver} onClick={() => setVer(!ver)}>
          <Ojo abierto={!ver} />
        </button>
      </div>
    </div>
  );
}

function Entrar() {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  // Si alguien abre un link de acceso viejo, se explica aquí mismo.
  const [error, setError] = useState<string | null>(() => errorDelLink());
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.entrar(email.trim(), contrasena);
    } catch (err) {
      setError(mensajeError(err));
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <div className="card login-card">
        <Globito />
        <h1 className="h1">Panel de los papás</h1>
        <form onSubmit={enviar}>
          <p className="lede">Entra con tu correo y tu contraseña.</p>
          <div className="field" style={{ marginTop: 20 }}>
            <label htmlFor="email">Correo</label>
            <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={{ marginTop: 14 }}>
            <CampoContrasena id="pass" label="Contraseña" value={contrasena} onChange={setContrasena} autoComplete="current-password" />
          </div>
          <button
            type="submit"
            className="btn"
            style={{ marginTop: 18, width: '100%', justifyContent: 'center' }}
            disabled={enviando || !email.trim() || !contrasena}
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
          {error && (
            <p className="err" role="alert">
              {error}
            </p>
          )}
          <p className="muted login-ayuda">¿Olvidaste tu contraseña? Pídele a quien administra la página que te asigne una nueva.</p>
        </form>
      </div>
    </div>
  );
}

/** Ventana para cambiar la contraseña ya con la sesión iniciada. */
function CambiarContrasena({ onCerrar, avisar }: { onCerrar: () => void; avisar: (m: string) => void }) {
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const falta = nueva.length < 8 ? 'Usa al menos 8 caracteres.' : nueva !== repetir ? 'Las dos contraseñas no coinciden.' : '';

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onCerrar]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (falta) return;
    setGuardando(true);
    setError(null);
    try {
      await api.cambiarContrasena(nueva);
      avisar('Contraseña cambiada. Úsala la próxima vez que entres.');
      onCerrar();
    } catch (err) {
      setError(mensajeError(err));
      setGuardando(false);
    }
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <form className="card modal" role="dialog" aria-modal="true" aria-labelledby="t-pass" onSubmit={guardar} onClick={(e) => e.stopPropagation()}>
        <p className="h3" id="t-pass">
          Cambiar contraseña
        </p>
        <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>
          <CampoContrasena id="nueva" label="Nueva contraseña" value={nueva} onChange={setNueva} autoComplete="new-password" />
          <CampoContrasena id="repetir" label="Repítela" value={repetir} onChange={setRepetir} autoComplete="new-password" />
        </div>
        <p className={error ? 'err' : 'muted'} role={error ? 'alert' : undefined} style={{ marginTop: 12 }}>
          {error ?? (nueva || repetir ? falta : 'Al menos 8 caracteres.')}
        </p>
        <div className="modal-acciones">
          <button type="button" className="btn btn-o" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn" disabled={!!falta || guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function Panel() {
  const [sesion, setSesion] = useState<{ email: string; admin: boolean } | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('resumen');
  const [toast, setToast] = useState<string | null>(null);
  const [cambiandoPass, setCambiandoPass] = useState(false);
  // Menú "Más" del celular (en escritorio esas opciones siempre están abajo del menú lateral).
  const [mas, setMas] = useState(false);

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
  useTema(datos.evento);

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
          <div className="brand-txt">
            <p className="brand-t">Panel de los papás</p>
            <p className="brand-s">{api.modo === 'demo' ? 'Modo demo' : 'Solo ustedes ven esto'}</p>
          </div>
          <button
            type="button"
            className={`mas${mas ? ' on' : ''}`}
            aria-expanded={mas}
            aria-controls="side-foot"
            aria-label="Más opciones"
            onClick={() => setMas(!mas)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>
        <nav className="nav" aria-label="Secciones del panel">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`tab${tab === t.id ? ' on' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => {
                setTab(t.id);
                setMas(false);
                window.scrollTo({ top: 0 });
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={t.icon} />
              </svg>
              <span className="tab-l">{t.label}</span>
              <span className="tab-c">{t.corto}</span>
              {t.id === 'rsvp' && datos.asistencias.length > 0 && <span className="badge">{datos.asistencias.length}</span>}
              {t.id === 'mem' && pendientes > 0 && <span className="badge">{pendientes}</span>}
            </button>
          ))}
        </nav>
        {mas && <div className="mas-fondo" onClick={() => setMas(false)} aria-hidden="true" />}
        <div className={`side-foot${mas ? ' abierto' : ''}`} id="side-foot">
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
              <button
                type="button"
                className="side-out"
                onClick={() => {
                  setMas(false);
                  setCambiandoPass(true);
                }}
              >
                Cambiar contraseña
              </button>
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
      {cambiandoPass && <CambiarContrasena onCerrar={() => setCambiandoPass(false)} avisar={setToast} />}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
