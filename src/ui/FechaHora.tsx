import { Selector, type Opcion } from './Selector';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const dos = (n: number) => String(n).padStart(2, '0');

/** Día, mes y año con selectores propios. Valor y salida en formato "AAAA-MM-DD". */
export function SelectorFecha({ valor, onCambio }: { valor: string; onCambio: (v: string) => void }) {
  const [y, m, d] = valor.split('-').map(Number);
  const diasDelMes = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const actual = new Date().getFullYear();
  const anios = Array.from(new Set([y, actual, actual + 1, actual + 2])).sort();

  const cambiar = (ny: number, nm: number, nd: number) => {
    const max = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
    onCambio(`${ny}-${dos(nm)}-${dos(Math.min(nd, max))}`);
  };

  return (
    <div className="fecha-hora">
      <Selector
        etiqueta="Día"
        valor={dos(d)}
        opciones={Array.from({ length: diasDelMes }, (_, i): Opcion<string> => ({ valor: dos(i + 1), texto: String(i + 1) }))}
        onCambio={(v) => cambiar(y, m, Number(v))}
      />
      <Selector
        etiqueta="Mes"
        valor={dos(m)}
        opciones={MESES.map((t, i): Opcion<string> => ({ valor: dos(i + 1), texto: t.charAt(0).toUpperCase() + t.slice(1) }))}
        onCambio={(v) => cambiar(y, Number(v), d)}
      />
      <Selector
        etiqueta="Año"
        valor={String(y)}
        opciones={anios.map((a): Opcion<string> => ({ valor: String(a), texto: String(a) }))}
        onCambio={(v) => cambiar(Number(v), m, d)}
      />
    </div>
  );
}

/** Hora, minutos y am/pm con selectores propios. Valor y salida en formato 24 h "HH:MM". */
export function SelectorHora({ valor, onCambio }: { valor: string; onCambio: (v: string) => void }) {
  const [h24, min] = valor.split(':').map(Number);
  const pm = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const minutos = Array.from(new Set([0, 15, 30, 45, min])).sort((a, b) => a - b);

  const cambiar = (h: number, mi: number, tarde: boolean) => {
    const h24n = (h % 12) + (tarde ? 12 : 0);
    onCambio(`${dos(h24n)}:${dos(mi)}`);
  };

  return (
    <div className="hora-sel">
      <Selector
        etiqueta="Hora"
        valor={String(h12)}
        opciones={Array.from({ length: 12 }, (_, i): Opcion<string> => ({ valor: String(i + 1), texto: String(i + 1) }))}
        onCambio={(v) => cambiar(Number(v), min, pm)}
      />
      <Selector
        etiqueta="Minutos"
        valor={dos(min)}
        opciones={minutos.map((x): Opcion<string> => ({ valor: dos(x), texto: `:${dos(x)}` }))}
        onCambio={(v) => cambiar(h12, Number(v), pm)}
      />
      <Selector
        etiqueta="Mañana o tarde"
        valor={pm ? 'pm' : 'am'}
        opciones={[
          { valor: 'am', texto: 'a.m.' },
          { valor: 'pm', texto: 'p.m.' },
        ]}
        onCambio={(v) => cambiar(h12, min, v === 'pm')}
      />
    </div>
  );
}
