import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react';
import { api, mensajeError } from '../../lib/api';
import { aIso, fechaCorta, fechaHoraCorta, partesLocales, titulo } from '../../lib/formato';
import { reducirFoto } from '../../lib/imagen';
import { appleMaps, googleMaps } from '../../lib/mapas';
import { PRESETS, TEMAS, coloresDe, contraste, esHex, temaDe } from '../../lib/tema';
import { SelectorFecha, SelectorHora } from '../../ui/FechaHora';
import { Tarjeta } from '../../ui/Tarjeta';
import type { Asistencia, Colores, Evento, FotoHistoria, FotoRecuerdo, Respuesta, Sexo, Tema } from '../../lib/types';
import { Lluvia } from '../revelacion/Celebracion';
import type { DatosPanel } from './usePanel';

type Avisar = (msg: string) => void;
type Props = { d: DatosPanel; recargar: () => Promise<void>; avisar: Avisar };

const ETIQUETA: Record<Respuesta, string> = { si: 'Viene', tal_vez: 'Tal vez', no: 'No viene' };
const PILL: Record<Respuesta, string> = { si: 'p-si', tal_vez: 'p-tv', no: 'p-no' };

function totales(a: Asistencia[]) {
  const si = a.filter((x) => x.respuesta === 'si');
  const tv = a.filter((x) => x.respuesta === 'tal_vez');
  const no = a.filter((x) => x.respuesta === 'no');
  const suma = (xs: Asistencia[], k: 'personas' | 'adultos' | 'ninos') => xs.reduce((s, x) => s + x[k], 0);
  return {
    si,
    tv,
    no,
    personas: suma(si, 'personas'),
    // adultos = quienes confirman + adultos que los acompañan
    adultos: si.length + suma(si, 'adultos'),
    ninos: suma(si, 'ninos'),
    posibles: suma(tv, 'personas'),
  };
}

/** "1 adulto y 2 niños" (solo acompañantes) */
function quienesVienen(a: Asistencia): string {
  const p: string[] = [];
  if (a.adultos) p.push(`${a.adultos} ${a.adultos === 1 ? 'adulto' : 'adultos'}`);
  if (a.ninos) p.push(`${a.ninos} ${a.ninos === 1 ? 'niño' : 'niños'}`);
  return p.join(' y ');
}

function iniciales(n: string) {
  return n
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ------------------------------------------------------------------ */

export function Resumen({ d, irA }: { d: DatosPanel; irA: (t: string) => void }) {
  const t = totales(d.asistencias);
  const nina = d.predicciones.filter((p) => p.prediccion === 'nina').length;
  const total = d.predicciones.length;
  const pn = total ? Math.round((nina / total) * 100) : 50;
  const publicadas = d.recuerdos.filter((r) => r.estado === 'publicada').length;
  const pendientes = d.recuerdos.filter((r) => r.estado === 'pendiente').length;

  return (
    <>
      <div className="top">
        <div>
          <h1 className="h1">Resumen</h1>
          {d.evento && <p className="lede">Cómo va todo para el {fechaCorta(d.evento.fecha_hora)}.</p>}
        </div>
      </div>
      <div className="stats">
        <div className="card stat">
          <p className="k">Personas que vienen</p>
          <p className="v">{t.personas}</p>
          <p className="s">
            {t.adultos} adultos y {t.ninos} niños
          </p>
        </div>
        <div className="card stat">
          <p className="k">Tal vez</p>
          <p className="v">{t.posibles}</p>
          <p className="s">{t.tv.length} aún no saben</p>
        </div>
        <div className="card stat">
          <p className="k">No podrán ir</p>
          <p className="v">{t.no.length}</p>
          <p className="s">avisaron que no</p>
        </div>
        <div className="card stat">
          <p className="k">Predicciones</p>
          <p className="v">{total}</p>
          <p className="s">
            {publicadas} fotos del día, {pendientes} por aprobar
          </p>
        </div>
      </div>
      <div className="two">
        <div className="card">
          <p className="h3">Últimas respuestas</p>
          {d.asistencias.length === 0 ? (
            <p className="muted">Todavía nadie confirma. Comparte el link de la invitación.</p>
          ) : (
            <ul className="feed">
              {d.asistencias.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <span className={`av av-${a.respuesta}`}>{iniciales(a.nombre)}</span>
                  <div>
                    <div>
                      <strong>{a.nombre}</strong>{' '}
                      {a.respuesta === 'si'
                        ? `confirmó ${a.personas} ${a.personas === 1 ? 'persona' : 'personas'}`
                        : a.respuesta === 'tal_vez'
                          ? `aún no sabe (${a.personas} ${a.personas === 1 ? 'persona' : 'personas'})`
                          : 'no podrá ir'}
                    </div>
                    <div className="t">{fechaHoraCorta(a.actualizado_en)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="btn btn-o btn-sm" style={{ marginTop: 12 }} onClick={() => irA('rsvp')}>
            Ver todas
          </button>
        </div>
        <div className="card">
          <p className="h3">Predicciones</p>
          <div className="split">
            <div className="split-g" style={{ width: `${pn}%` }} />
            <div className="split-b" style={{ width: `${100 - pn}%` }} />
          </div>
          <div className="legend">
            <span>
              <span className="dot dg" />
              Niña {total ? `${pn}%` : '—'}
            </span>
            <span>
              <span className="dot db" />
              Niño {total ? `${100 - pn}%` : '—'}
            </span>
          </div>
          <p className="muted" style={{ marginTop: 18 }}>
            Las predicciones se cierran solas cuando presionen “Revelar a todos”.
          </p>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function exportarCsv(filas: Asistencia[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lineas = [
    ['Nombre', 'Respuesta', 'Total personas', 'Adultos acompañantes', 'Niños', 'Nombres de acompañantes', 'Mensaje', 'Fecha'].map(esc).join(','),
    ...filas.map((a) =>
      [a.nombre, ETIQUETA[a.respuesta], a.personas, a.adultos, a.ninos, a.acompanantes, a.mensaje, fechaHoraCorta(a.actualizado_en)].map(esc).join(','),
    ),
  ];
  // BOM para que Excel respete los acentos
  const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'confirmaciones.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Confirmaciones({ d, avisar }: Pick<Props, 'd' | 'avisar'>) {
  const [filtro, setFiltro] = useState<'todas' | Respuesta>('todas');
  const [q, setQ] = useState('');
  const t = totales(d.asistencias);
  const filas = d.asistencias.filter(
    (a) => (filtro === 'todas' || a.respuesta === filtro) && (!q.trim() || a.nombre.toLowerCase().includes(q.trim().toLowerCase())),
  );
  const chips: { id: 'todas' | Respuesta; txt: string }[] = [
    { id: 'todas', txt: `Todas (${d.asistencias.length})` },
    { id: 'si', txt: `Vienen (${t.si.length})` },
    { id: 'tal_vez', txt: `Tal vez (${t.tv.length})` },
    { id: 'no', txt: `No vienen (${t.no.length})` },
  ];

  return (
    <>
      <div className="top">
        <div>
          <h1 className="h1">Confirmaciones</h1>
          <p className="lede">
            {t.personas} personas vienen y {t.posibles} más tal vez.
          </p>
        </div>
        <button
          type="button"
          className="btn"
          disabled={d.asistencias.length === 0}
          onClick={() => {
            exportarCsv(filas);
            avisar('Se descargó confirmaciones.csv (se abre en Excel)');
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </svg>
          Descargar para Excel
        </button>
      </div>
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filtrar">
          {chips.map((c) => (
            <button key={c.id} type="button" className={`chip${filtro === c.id ? ' on' : ''}`} aria-pressed={filtro === c.id} onClick={() => setFiltro(c.id)}>
              {c.txt}
            </button>
          ))}
        </div>
        <input className="search" type="search" placeholder="Buscar por nombre" aria-label="Buscar por nombre" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="tbl">
        <div className="tr th">
          <span>Nombre</span>
          <span>Respuesta</span>
          <span>Personas</span>
          <span>Acompañantes</span>
          <span>Mensaje</span>
          <span>Fecha</span>
        </div>
        {filas.map((a) => (
          <div className="tr" key={a.id}>
            <span className="nm">{a.nombre}</span>
            <span>
              <span className={`pill ${PILL[a.respuesta]}`}>{ETIQUETA[a.respuesta]}</span>
            </span>
            <span className="tot">{a.respuesta === 'no' ? '—' : a.personas}</span>
            <span className="acp">
              {a.respuesta === 'no' || a.personas <= 1 ? (
                <span className="muted">{a.respuesta === 'no' ? '—' : 'Viene sola(o)'}</span>
              ) : (
                <>
                  <span>{quienesVienen(a)}</span>
                  {a.acompanantes && <span className="acp-n">{a.acompanantes}</span>}
                </>
              )}
            </span>
            <span className="msg">{a.mensaje || '—'}</span>
            <span className="when">{fechaHoraCorta(a.actualizado_en)}</span>
          </div>
        ))}
        {filas.length === 0 && <div className="empty">{d.asistencias.length ? 'Nadie coincide con esa búsqueda.' : 'Todavía no hay respuestas.'}</div>}
        <div className="tfoot">
          <span>{filas.length} respuestas</span>
          <span>{filas.reduce((s, a) => s + a.personas, 0)} personas</span>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

/** Imagen que, si el navegador no la puede mostrar (p. ej. una HEIC subida antes), lo explica en vez de verse rota. */
function FotoSegura({ src, alt }: { src: string; alt: string }) {
  const [rota, setRota] = useState(false);
  if (rota) {
    return (
      <span className="foto-rota">
        Este navegador no puede mostrar esta foto (probablemente es HEIC del iPhone). Quítala y vuelve a subirla.
      </span>
    );
  }
  return <img src={src} alt={alt} onError={() => setRota(true)} />;
}

const CAMPOS_COLOR: { k: keyof Colores; nombre: string }[] = [
  { k: 'nina', nombre: 'Niña' },
  { k: 'nino', nombre: 'Niño' },
  { k: 'tinta', nombre: 'Texto y botones' },
  { k: 'papel', nombre: 'Fondo' },
];

/** Variables CSS para pintar un recuadro con una paleta sin cambiar el resto del panel. */
function estiloTema(tema: Tema, c: Colores): CSSProperties {
  return tema === 'personal'
    ? ({ '--globo-nina': c.nina, '--globo-nino': c.nino, '--tinta': c.tinta, '--papel': c.papel } as CSSProperties)
    : {};
}

/** Muestra mini de una paleta: "¿Niña o niño?" con sus colores sobre su fondo. */
function Muestra({ tema, c }: { tema: Tema; c: Colores }) {
  return (
    <span className="ev-muestra" data-tema={tema} style={{ ...estiloTema(tema, c), background: 'var(--papel)' }} aria-hidden="true">
      <i style={{ color: 'var(--tinta-nina)' }}>¿Niña</i>
      <em style={{ color: 'var(--texto-tenue)' }}>o</em>
      <i style={{ color: 'var(--tinta-nino)' }}>niño?</i>
    </span>
  );
}

/** Un color: muestra con selector + campo hexadecimal. */
function CampoColor({ id, nombre, valor, onCambio }: { id: string; nombre: string; valor: string; onCambio: (v: string) => void }) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  return (
    <div className="ev-color">
      <input className="ev-color-pick" type="color" aria-label={`${nombre}: elegir color`} value={valor} onChange={(e) => onCambio(e.target.value.toUpperCase())} />
      <div className="ev-color-txt">
        <label htmlFor={id}>{nombre}</label>
        <input
          id={id}
          className={`ev-color-hex${esHex(texto) ? '' : ' mal'}`}
          type="text"
          spellCheck={false}
          maxLength={7}
          value={texto}
          onChange={(e) => {
            let v = e.target.value.trim();
            if (v && !v.startsWith('#')) v = `#${v}`;
            setTexto(v.toUpperCase());
            if (esHex(v)) onCambio(v.toUpperCase());
          }}
          onBlur={() => setTexto(valor)}
        />
      </div>
    </div>
  );
}

/** Elegir paleta. Solo cambia el borrador del formulario; se publica con "Guardar cambios". */
function ElegirColores({
  tema,
  colores,
  enUso,
  onCambio,
}: {
  tema: Tema;
  colores: Colores;
  enUso: Tema;
  onCambio: (tema: Tema, colores: Colores) => void;
}) {
  const opciones: { valor: Tema; nombre: string; c: Colores }[] = [
    ...TEMAS.map((t) => ({ valor: t.valor as Tema, nombre: t.nombre, c: t.colores })),
    { valor: 'personal', nombre: 'Personalizada', c: colores },
  ];
  const bajo = tema === 'personal' && contraste(colores.tinta, colores.papel) < 4.5;

  return (
    <>
      <div className="ev-temas" role="radiogroup" aria-label="Colores de la invitación">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={tema === o.valor}
            className={`ev-tema${tema === o.valor ? ' on' : ''}`}
            onClick={() => onCambio(o.valor, o.valor === 'personal' ? colores : o.c)}
          >
            <Muestra tema={o.valor} c={o.c} />
            <span className="ev-tema-n">
              {o.nombre}
              {enUso === o.valor && <small>En uso</small>}
            </span>
          </button>
        ))}
      </div>

      {tema === 'personal' && (
        <div className="ev-paleta">
          <p className="ev-mini">Empezar desde una combinación</p>
          <div className="ev-presets">
            {PRESETS.map((p) => {
              const igual = (Object.keys(p.colores) as (keyof Colores)[]).every((k) => p.colores[k].toUpperCase() === colores[k].toUpperCase());
              return (
                <button key={p.nombre} type="button" className={`ev-preset${igual ? ' on' : ''}`} onClick={() => onCambio('personal', { ...p.colores })}>
                  <span className="ev-preset-pts" aria-hidden="true">
                    <i style={{ background: p.colores.nina }} />
                    <i style={{ background: p.colores.nino }} />
                    <i style={{ background: p.colores.tinta }} />
                  </span>
                  {p.nombre}
                </button>
              );
            })}
          </div>
          <p className="ev-mini">O ajustar cada color</p>
          <div className="ev-colores">
            {CAMPOS_COLOR.map((c) => (
              <CampoColor key={c.k} id={`color-${c.k}`} nombre={c.nombre} valor={colores[c.k]} onCambio={(v) => onCambio('personal', { ...colores, [c.k]: v })} />
            ))}
          </div>
          {bajo && <p className="ev-aviso">El texto casi no contrasta con el fondo y a algunos invitados les costará leerlo. Prueben un texto más oscuro o un fondo más claro.</p>}
        </div>
      )}
    </>
  );
}

function Grupo({ titulo, ayuda, children }: { titulo: string; ayuda: string; children: ReactNode }) {
  return (
    <section className="ev-grupo">
      <div className="ev-grupo-cab">
        <h2>{titulo}</h2>
        <p>{ayuda}</p>
      </div>
      <div className="ev-grupo-campos">{children}</div>
    </section>
  );
}

interface FormEvento {
  fecha: string;
  hora: string;
  papas: string;
  lugar: string;
  direccion: string;
  telefono: string;
  nota: string;
  tema: Tema;
  colores: Colores;
}

function desdeEvento(ev: Evento): FormEvento {
  const p = partesLocales(ev.fecha_hora);
  return {
    fecha: p.fecha,
    hora: p.hora,
    papas: ev.nombres_papas,
    lugar: ev.lugar,
    direccion: ev.direccion,
    telefono: ev.telefono,
    nota: ev.nota,
    tema: temaDe(ev),
    colores: coloresDe(ev),
  };
}

export function DatosEvento({ d, recargar, avisar }: Props) {
  const ev = d.evento;
  const [f, setF] = useState<FormEvento | null>(null);
  const [guardado, setGuardado] = useState<FormEvento | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (ev && !f) {
      const x = desdeEvento(ev);
      setF(x);
      setGuardado(x);
    }
  }, [ev, f]);

  if (!ev || !f || !guardado) return null;
  const cambios = JSON.stringify(f) !== JSON.stringify(guardado);
  const set = (k: keyof FormEvento) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const iso = aIso(f.fecha, f.hora);
  const vista: Evento = { ...ev, fecha_hora: iso, lugar: f.lugar.trim(), direccion: f.direccion.trim(), nombres_papas: f.papas.trim(), telefono: f.telefono.trim() };

  async function guardar() {
    if (!f) return;
    setGuardando(true);
    try {
      await api.actualizarEvento({
        fecha_hora: iso,
        lugar: f.lugar.trim(),
        direccion: f.direccion.trim(),
        nota: f.nota.trim(),
        nombres_papas: f.papas.trim(),
        telefono: f.telefono.trim(),
        tema: f.tema,
        ...(f.tema === 'personal' ? { colores: f.colores } : {}),
      });
      await recargar();
      setGuardado(f);
      avisar('Cambios guardados. La invitación ya está actualizada.');
    } catch (e) {
      avisar(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <div className="top">
        <div>
          <h1 className="h1">Datos del evento</h1>
          <p className="lede">Editen lo que ven los invitados. Nada cambia en la invitación hasta que presionen “Guardar cambios”.</p>
        </div>
      </div>

      <div className="evento">
        <div className="card ev-form">
          <Grupo titulo="Fecha y hora" ayuda="En hora de Tijuana.">
            <div className="field">
              <span className="ev-lbl">Fecha</span>
              <SelectorFecha valor={f.fecha} onCambio={(fecha) => setF({ ...f, fecha })} />
            </div>
            <div className="field">
              <span className="ev-lbl">Hora</span>
              <SelectorHora valor={f.hora} onCambio={(hora) => setF({ ...f, hora })} />
            </div>
          </Grupo>

          <Grupo titulo="Quiénes invitan" ayuda="Así aparecen sus nombres en la invitación y en la tarjeta.">
            <div className="field">
              <label htmlFor="f-papas">Sus nombres</label>
              <input id="f-papas" type="text" placeholder="Por ejemplo, Ana y Luis" value={f.papas} onChange={set('papas')} />
            </div>
          </Grupo>

          <Grupo titulo="Lugar" ayuda="Con la dirección se arman los botones de Google Maps y Apple Maps.">
            <div className="field">
              <label htmlFor="f-lugar">Nombre del lugar</label>
              <input id="f-lugar" type="text" placeholder="Por ejemplo, Jardín Las Flores" value={f.lugar} onChange={set('lugar')} />
            </div>
            <div className="field">
              <label htmlFor="f-dir">Dirección</label>
              <input id="f-dir" type="text" placeholder="Calle, número, colonia y ciudad" value={f.direccion} onChange={set('direccion')} />
            </div>
            {f.direccion.trim() && (
              <div className="ev-mapas">
                <span className="ev-mini">Probar:</span>
                <a className="btn btn-o btn-sm" href={googleMaps(f.direccion.trim())} target="_blank" rel="noopener noreferrer">
                  Google Maps
                </a>
                <a className="btn btn-o btn-sm" href={appleMaps(f.direccion.trim())} target="_blank" rel="noopener noreferrer">
                  Apple Maps
                </a>
              </div>
            )}
          </Grupo>

          <Grupo titulo="Contacto y nota" ayuda="Opcionales. El teléfono es para quien prefiera confirmar llamando.">
            <div className="field">
              <label htmlFor="f-tel">Teléfono</label>
              <input id="f-tel" type="tel" placeholder="Para quien prefiera llamar" value={f.telefono} onChange={set('telefono')} />
            </div>
            <div className="field">
              <label htmlFor="f-nota">Nota para los invitados</label>
              <textarea id="f-nota" rows={3} placeholder="Por ejemplo, hay estacionamiento en la entrada" value={f.nota} onChange={set('nota')} />
            </div>
          </Grupo>

          <Grupo titulo="Colores" ayuda="Elijan una paleta o armen la suya. La vista previa cambia al momento.">
            <ElegirColores tema={f.tema} colores={f.colores} enUso={guardado.tema} onCambio={(tema, colores) => setF({ ...f, tema, colores })} />
          </Grupo>
        </div>

        <aside className="card ev-prev">
          <p className="h3">Vista previa</p>
          <div className="ev-prev-marco" data-tema={f.tema} style={estiloTema(f.tema, f.colores)}>
            <Tarjeta evento={vista} className="ev-prev-tarjeta" />
          </div>
          <p className="muted">{cambios ? 'Así quedará cuando guarden.' : 'Así se ve ahora.'}</p>
          <div className="ev-prev-links">
            <a className="btn btn-o btn-sm" href="/" target="_blank" rel="noopener noreferrer">
              Ver la invitación
            </a>
            <a className="btn btn-o btn-sm" href="/tarjeta" target="_blank" rel="noopener noreferrer">
              Abrir tarjeta
            </a>
          </div>
        </aside>
      </div>

      {cambios && (
        <div className="ev-guardar" role="region" aria-label="Cambios sin guardar">
          <span>Tienen cambios sin guardar</span>
          <button type="button" className="btn btn-o btn-sm" disabled={guardando} onClick={() => setF(guardado)}>
            Descartar
          </button>
          <button type="button" className="btn btn-sm" disabled={guardando} onClick={() => void guardar()}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

export function Historia({ d, recargar, avisar }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const fotos = d.historia;

  async function elegir(e: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []).slice(0, Math.max(0, 12 - fotos.length));
    e.target.value = '';
    if (!archivos.length) {
      avisar('Ya tienen 12 fotos. Quiten alguna para subir más.');
      return;
    }
    try {
      for (let i = 0; i < archivos.length; i++) {
        setSubiendo(`Subiendo ${i + 1} de ${archivos.length}…`);
        const titulo = archivos[i].name.replace(/\.[^.]+$/, '').slice(0, 80);
        await api.subirFotoHistoria(await reducirFoto(archivos[i]), titulo, 'foto');
      }
      await recargar();
      avisar(archivos.length === 1 ? 'Foto agregada' : `${archivos.length} fotos agregadas`);
    } catch (err) {
      avisar(mensajeError(err));
    } finally {
      setSubiendo(null);
    }
  }

  async function mover(i: number, dir: -1 | 1) {
    const ids = fotos.map((f) => f.id);
    [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
    await api.ordenarFotosHistoria(ids);
    await recargar();
  }

  async function editar(f: FotoHistoria, cambios: Partial<Pick<FotoHistoria, 'titulo' | 'tipo'>>) {
    await api.editarFotoHistoria(f.id, cambios);
    await recargar();
  }

  async function borrar(f: FotoHistoria) {
    if (!window.confirm(`¿Quitar “${f.titulo || 'esta foto'}” de la invitación?`)) return;
    await api.borrarFotoHistoria(f.id);
    await recargar();
    avisar('Foto quitada');
  }

  return (
    <>
      <div className="top">
        <div>
          <h1 className="h1">Nuestra historia</h1>
          <p className="lede">Las fotos que aparecen en la invitación, en este orden.</p>
        </div>
      </div>
      <div className="drop">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7A746D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
        </svg>
        <strong>Sube sus fotos</strong>
        <span className="muted">Desde el celular o la computadora. Hasta 12 fotos.</span>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={elegir} />
        <button type="button" className="btn btn-sm" disabled={!!subiendo} onClick={() => input.current?.click()}>
          {subiendo ?? 'Elegir fotos'}
        </button>
      </div>
      <div className="photos">
        {fotos.map((f, i) => (
          <div className="ph" key={f.id}>
            <div className={`ph-img ${f.url ? '' : f.tipo === 'ecografia' ? 'tn-us' : 'tn1'}`}>
              <span className="ph-n">{i + 1}</span>
              {f.url ? <FotoSegura src={f.url} alt={f.titulo} /> : <span>{f.tipo === 'ecografia' ? 'Ecografía de muestra' : 'Foto de muestra'}</span>}
            </div>
            <div className="ph-b">
              <input type="text" defaultValue={f.titulo} maxLength={80} aria-label="Título de la foto" onBlur={(e) => e.target.value !== f.titulo && void editar(f, { titulo: e.target.value })} />
              <div className="ph-act">
                <button type="button" className="ib" aria-label="Mover antes" disabled={i === 0} onClick={() => void mover(i, -1)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button type="button" className="ib" aria-label="Mover después" disabled={i === fotos.length - 1} onClick={() => void mover(i, 1)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                <button type="button" className="ib ib-del" aria-label="Quitar foto" onClick={() => void borrar(f)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {fotos.length === 0 && <p className="muted" style={{ marginTop: 20 }}>Aún no hay fotos. Si no suben ninguna, la sección no aparece en la invitación.</p>}
    </>
  );
}

/* ------------------------------------------------------------------ */

export function Recuerdos({ d, recargar, avisar }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const ev = d.evento;
  const pendientes = d.recuerdos.filter((r) => r.estado === 'pendiente');
  const publicadas = d.recuerdos.filter((r) => r.estado === 'publicada');

  async function alternar(campo: 'galeria_visible' | 'invitados_suben_fotos') {
    if (!ev) return;
    await api.actualizarEvento({ [campo]: !ev[campo] });
    await recargar();
  }

  async function accion(fn: () => Promise<void>, msg: string) {
    try {
      await fn();
      await recargar();
      avisar(msg);
    } catch (e) {
      avisar(mensajeError(e));
    }
  }

  async function elegir(e: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = '';
    try {
      for (let i = 0; i < archivos.length; i++) {
        setSubiendo(`Subiendo ${i + 1} de ${archivos.length}…`);
        await api.subirRecuerdoAdmin(await reducirFoto(archivos[i]));
      }
      await recargar();
      if (archivos.length) avisar('Fotos publicadas');
    } catch (err) {
      avisar(mensajeError(err));
    } finally {
      setSubiendo(null);
    }
  }

  const Interruptor = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
    <button type="button" className={`toggle${on ? ' on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={onClick} />
  );

  const Tarjeta = ({ f, children }: { f: FotoRecuerdo; children?: React.ReactNode }) => (
    <div className="pd">
      <div className="pd-img">{f.url ? <FotoSegura src={f.url} alt={`Foto de ${f.subida_por}`} /> : 'Foto'}</div>
      <div className="pd-b">
        <span>
          De <strong>{f.subida_por || 'Invitado'}</strong>
        </span>
        {children}
      </div>
    </div>
  );

  return (
    <>
      <div className="top">
        <div>
          <h1 className="h1">Recuerdos del día</h1>
          <p className="lede">Las fotos de la fiesta que se ven en la invitación.</p>
        </div>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={elegir} />
        <button type="button" className="btn" disabled={!!subiendo} onClick={() => input.current?.click()}>
          {subiendo ?? 'Subir fotos'}
        </button>
      </div>
      {ev && (
        <div className="card">
          <div className="sw">
            <div>
              <p className="sw-t">Mostrar la galería en la invitación</p>
              <p className="sw-d">Mientras esté apagado se ve cerrada, con el aviso de la fecha en que se abre.</p>
            </div>
            <Interruptor on={ev.galeria_visible} label="Mostrar la galería" onClick={() => void alternar('galeria_visible')} />
          </div>
          <div className="sw">
            <div>
              <p className="sw-t">Los invitados pueden subir fotos</p>
              <p className="sw-d">Se abre a partir del día del evento. Sus fotos esperan aquí hasta que ustedes las aprueben.</p>
            </div>
            <Interruptor on={ev.invitados_suben_fotos} label="Permitir fotos de invitados" onClick={() => void alternar('invitados_suben_fotos')} />
          </div>
        </div>
      )}
      <div className="card">
        <p className="h3">Por aprobar ({pendientes.length})</p>
        {pendientes.length === 0 ? (
          <p className="muted">No hay fotos esperando.</p>
        ) : (
          <div className="pend">
            {pendientes.map((f) => (
              <Tarjeta key={f.id} f={f}>
                <div className="pd-a">
                  <button type="button" className="btn btn-sm" onClick={() => void accion(() => api.aprobarRecuerdo(f), 'Foto aprobada')}>
                    Aprobar
                  </button>
                  <button type="button" className="btn btn-o btn-sm" onClick={() => void accion(() => api.quitarRecuerdo(f), 'Foto quitada')}>
                    Quitar
                  </button>
                </div>
              </Tarjeta>
            ))}
          </div>
        )}
      </div>
      <div className="card">
        <p className="h3">Publicadas ({publicadas.length})</p>
        {publicadas.length === 0 ? (
          <p className="muted">Aún no hay fotos publicadas.</p>
        ) : (
          <div className="pend">
            {publicadas.map((f) => (
              <Tarjeta key={f.id} f={f}>
                <button type="button" className="lnk" style={{ padding: 0, minHeight: 0, fontSize: 13 }} onClick={() => void accion(() => api.quitarRecuerdo(f), 'Foto quitada')}>
                  Quitar
                </button>
              </Tarjeta>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function LaRevelacion({ d, recargar, avisar }: Props) {
  const [paso, setPaso] = useState<'listo' | 'confirmar' | 'enviando'>('listo');
  const [link, setLink] = useState<{ url: string; pin: string } | null>(null);
  const [ensayo, setEnsayo] = useState<Sexo | null>(null);
  const ev = d.evento;
  const sello = d.sello;
  const revelado = ev?.estado === 'revelado' && ev.resultado;
  const aciertos = useMemo(() => (ev?.resultado ? d.predicciones.filter((p) => p.prediccion === ev.resultado).length : 0), [ev, d.predicciones]);

  async function generarLink() {
    if (sello?.link_creado && !window.confirm('Ya existe un link del guardián. Si generan uno nuevo, el anterior deja de funcionar. ¿Continuar?')) return;
    try {
      const r = await api.crearLinkGuardian();
      setLink({ url: `${window.location.origin}/guardian/${r.token}`, pin: r.pin });
      await recargar();
    } catch (e) {
      avisar(mensajeError(e));
    }
  }

  async function revelar() {
    setPaso('enviando');
    try {
      await api.revelar();
      await recargar();
      avisar('¡Revelado en todas las pantallas!');
    } catch (e) {
      avisar(mensajeError(e));
    } finally {
      setPaso('listo');
    }
  }

  async function reiniciar() {
    try {
      await api.reiniciarPrueba();
      await recargar();
      avisar('Evento de prueba reiniciado');
    } catch (e) {
      avisar(mensajeError(e));
    }
  }

  return (
    <>
      <div className="top">
        <div>
          <h1 className="h1">La revelación</h1>
          <p className="lede">Úsenlo desde el celular el día de la fiesta.</p>
        </div>
      </div>

      <div className="card">
        <div className="seal-st">
          <span className={`seal-ic${sello?.sellado ? '' : ' off'}`} aria-hidden="true">
            ?
          </span>
          <div>
            <p className="sw-t">{sello?.sellado ? 'Resultado sellado por el guardián' : 'El guardián todavía no sella el resultado'}</p>
            <p className="sw-d">
              {sello?.sellado && sello.sellado_en
                ? `Lo guardó el ${fechaHoraCorta(sello.sellado_en)}. Nadie más puede verlo, ni siquiera ustedes.`
                : 'Generen el link del guardián y compártanlo con la persona que tiene el sobre del doctor.'}
            </p>
          </div>
        </div>
        <div className="toolbar" style={{ margin: '18px 0 0' }}>
          <span className="muted">El guardián entra con su link y un PIN de 4 dígitos para capturar el resultado.</span>
          <button type="button" className="btn btn-o btn-sm" onClick={() => void generarLink()}>
            {sello?.link_creado ? 'Generar link nuevo' : 'Generar link del guardián'}
          </button>
        </div>
        {link && (
          <div className="confirm" style={{ textAlign: 'left' }}>
            <p>
              <strong>Mándale esto al guardián.</strong> Por seguridad solo se muestra una vez.
            </p>
            <div className="linkrow">
              <code>{link.url}</code>
              <button
                type="button"
                className="btn btn-o btn-sm"
                onClick={() => {
                  // Mensaje listo para WhatsApp: el link va solo en su línea para que no se mezcle con el PIN.
                  void navigator.clipboard?.writeText(
                    `Eres el guardián del sobre 🤫\n\nAbre este link:\n${link.url}\n\nY escribe este PIN: ${link.pin}`,
                  );
                  avisar('Mensaje con link y PIN copiado');
                }}
              >
                Copiar
              </button>
            </div>
            <p style={{ margin: '12px 0 0' }}>
              PIN: <strong style={{ fontSize: 22, letterSpacing: 4 }}>{link.pin}</strong>
            </p>
          </div>
        )}
      </div>

      <div className="card big-reveal">
        {revelado ? (
          <>
            <p className="muted" style={{ margin: 0 }}>
              Revelado el {ev.revelado_en ? fechaHoraCorta(ev.revelado_en) : ''}
            </p>
            <p className={`done-t ${ev.resultado === 'nina' ? 'ink-g' : 'ink-b'}`}>{titulo(ev.resultado!)}</p>
            <p className="muted" style={{ margin: '0 0 18px' }}>
              {aciertos} de {d.predicciones.length} acertaron.
            </p>
            {ev.es_prueba && (
              <button type="button" className="btn btn-o btn-sm" onClick={() => void reiniciar()}>
                Reiniciar evento de prueba
              </button>
            )}
          </>
        ) : paso === 'listo' ? (
          <>
            <p className="h3">Cuando estén listos</p>
            <p className="muted" style={{ margin: '0 auto 22px', maxWidth: '46ch' }}>
              Al presionar, todas las pantallas con la invitación abierta muestran el resultado al mismo tiempo y se cierran las predicciones.
            </p>
            <button type="button" className="btn btn-gold" disabled={!sello?.sellado} onClick={() => setPaso('confirmar')}>
              Revelar a todos
            </button>
            {!sello?.sellado && <p className="muted" style={{ marginTop: 12 }}>Se activa cuando el guardián selle el resultado.</p>}
          </>
        ) : (
          <div className="confirm" role="alertdialog" aria-label="Confirmar revelación">
            <p>
              <strong>¿Seguro?</strong> Esto no se puede deshacer y todos lo verán en este momento.
            </p>
            <div className="chips" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-red" disabled={paso === 'enviando'} onClick={() => void revelar()}>
                {paso === 'enviando' ? 'Revelando…' : 'Sí, revelar ahora'}
              </button>
              <button type="button" className="btn btn-o" disabled={paso === 'enviando'} onClick={() => setPaso('listo')}>
                Todavía no
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <p className="h3">Ensayo</p>
        <p className="muted" style={{ marginTop: 0 }}>
          Vean cómo se verá la celebración. Usa un resultado al azar y no afecta a los invitados.
        </p>
        <button type="button" className="btn btn-o btn-sm" onClick={() => setEnsayo(Math.random() < 0.5 ? 'nina' : 'nino')}>
          Ver ensayo
        </button>
      </div>

      <div className="card">
        <p className="h3">Cómo funciona ese día</p>
        <ol className="steps">
          <li>El guardián captura el resultado antes de la fiesta.</li>
          <li>Proyecten la invitación en una pantalla grande.</li>
          <li>A la hora acordada, presionen “Revelar a todos”.</li>
          <li>Abran la caja o corten el pastel al mismo tiempo.</li>
          <li>Después, activen “Recuerdos del día” para que todos suban sus fotos.</li>
        </ol>
      </div>

      {ensayo && (
        <div className="ensayo" role="dialog" aria-modal="true" aria-label="Ensayo de la celebración">
          <Lluvia sexo={ensayo} />
          <div className="ensayo-in">
            <p className={`done-t big ${ensayo === 'nina' ? 'ink-g' : 'ink-b'}`}>{titulo(ensayo)}</p>
            <p className="muted">Ensayo con resultado al azar</p>
            <button type="button" className="btn" onClick={() => setEnsayo(null)}>
              Cerrar ensayo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
