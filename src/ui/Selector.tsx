import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface Opcion<T extends string> {
  valor: T;
  texto: string;
  /** Texto secundario debajo de la opción (opcional) */
  detalle?: string;
}

interface Props<T extends string> {
  valor: T;
  opciones: Opcion<T>[];
  onCambio: (v: T) => void;
  /** Nombre para lectores de pantalla cuando no hay <label> visible */
  etiqueta: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Select propio (nunca usamos el nativo): botón + lista desplegable con el estilo de la app.
 * Accesible: patrón "listbox" con flechas, Inicio/Fin, Enter/Espacio, Escape y escribir para saltar.
 */
export function Selector<T extends string>({ valor, opciones, onCambio, etiqueta, disabled, className }: Props<T>) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(() => Math.max(0, opciones.findIndex((o) => o.valor === valor)));
  // Posición fija en pantalla: así ninguna tarjeta con overflow la recorta.
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; minWidth: number } | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const actual = opciones.find((o) => o.valor === valor) ?? opciones[0];

  function abrir() {
    if (disabled) return;
    setActiva(Math.max(0, opciones.findIndex((o) => o.valor === valor)));
    setAbierto(true);
  }

  function cerrar(enfocar = true) {
    setAbierto(false);
    setPos(null);
    if (enfocar) boton.current?.focus();
  }

  function elegir(i: number) {
    const o = opciones[i];
    if (o && o.valor !== valor) onCambio(o.valor);
    cerrar();
  }

  // Se coloca debajo del botón; si no cabe, arriba.
  useLayoutEffect(() => {
    if (!abierto || !boton.current || !lista.current) return;
    const b = boton.current.getBoundingClientRect();
    const alto = lista.current.offsetHeight;
    const arriba = b.bottom + alto + 12 > window.innerHeight && b.top > alto + 12;
    const left = Math.min(b.left, window.innerWidth - Math.max(b.width, lista.current.offsetWidth) - 8);
    setPos(arriba ? { bottom: window.innerHeight - b.top + 6, left, minWidth: b.width } : { top: b.bottom + 6, left, minWidth: b.width });
    lista.current.focus();
  }, [abierto]);

  // Al desplazar la página o cambiar el tamaño, se cierra (como el select nativo).
  useEffect(() => {
    if (!abierto) return;
    const cerrarSinFoco = (e: Event) => {
      if (e.type === 'scroll' && lista.current?.contains(e.target as Node)) return;
      setAbierto(false);
    };
    window.addEventListener('scroll', cerrarSinFoco, true);
    window.addEventListener('resize', cerrarSinFoco);
    return () => {
      window.removeEventListener('scroll', cerrarSinFoco, true);
      window.removeEventListener('resize', cerrarSinFoco);
    };
  }, [abierto]);

  // Clic fuera cierra.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) cerrar(false);
    };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  function teclaBoton(e: KeyboardEvent) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      abrir();
    }
  }

  function teclaLista(e: KeyboardEvent) {
    const n = opciones.length;
    if (e.key === 'ArrowDown') setActiva((i) => (i + 1) % n);
    else if (e.key === 'ArrowUp') setActiva((i) => (i - 1 + n) % n);
    else if (e.key === 'Home') setActiva(0);
    else if (e.key === 'End') setActiva(n - 1);
    else if (e.key === 'Enter' || e.key === ' ') elegir(activa);
    else if (e.key === 'Escape') cerrar();
    else if (e.key === 'Tab') return cerrar(false);
    else if (e.key.length === 1) {
      const i = opciones.findIndex((o) => o.texto.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i >= 0) setActiva(i);
      else return;
    } else return;
    e.preventDefault();
  }

  return (
    <div ref={raiz} className={`sel${abierto ? ' abierto' : ''}${className ? ` ${className}` : ''}`}>
      <button
        ref={boton}
        type="button"
        className="sel-boton"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-label={`${etiqueta}: ${actual?.texto ?? ''}`}
        disabled={disabled}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={teclaBoton}
      >
        <span className="sel-valor">{actual?.texto}</span>
        <svg className="sel-flecha" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {abierto && (
        <ul
          ref={lista}
          id={`${id}-lista`}
          className="sel-lista"
          style={pos ? { ...pos, visibility: 'visible' } : { visibility: 'hidden' }}
          role="listbox"
          tabIndex={-1}
          aria-label={etiqueta}
          aria-activedescendant={`${id}-op-${activa}`}
          onKeyDown={teclaLista}
        >
          {opciones.map((o, i) => (
            <li
              key={o.valor}
              id={`${id}-op-${i}`}
              role="option"
              aria-selected={o.valor === valor}
              className={`sel-op${i === activa ? ' activa' : ''}`}
              onPointerEnter={() => setActiva(i)}
              onClick={() => elegir(i)}
            >
              <span className="sel-op-txt">
                {o.texto}
                {o.detalle && <small>{o.detalle}</small>}
              </span>
              {o.valor === valor && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
