import { titulo } from '../../lib/formato';
import type { Sexo } from '../../lib/types';
import { Globo } from '../../ui/Globo';
import { CLARO_NINA, CLARO_NINO, NINA, NINO } from '../../ui/SvgDefs';

const GLOBOS = Array.from({ length: 16 }, (_, i) => ({
  l: 3 + ((i * 59) % 92),
  w: 70 + ((i * 23) % 70),
  dl: 0.2 + ((i * 13) % 22) / 10,
  du: 4.4 + ((i * 7) % 14) / 10,
  claro: i % 6 === 5,
}));
const BRILLO = Array.from({ length: 46 }, (_, i) => ({
  l: (i * 37 + 11) % 100,
  s: 3 + ((i * 5) % 6),
  dl: ((i * 11) % 30) / 10,
  du: 3 + ((i * 7) % 15) / 10,
}));

/** Globos que suben y brillo dorado que cae. Se usa en la invitación y en el ensayo del panel. */
export function Lluvia({ sexo }: { sexo: Sexo }) {
  const color = sexo === 'nina' ? NINA : NINO;
  const claro = sexo === 'nina' ? CLARO_NINA : CLARO_NINO;
  return (
    <>
      <div className="glit" aria-hidden="true">
        {BRILLO.map((g, i) => (
          <span
            key={i}
            className="gd"
            style={{ left: `${g.l}%`, width: g.s, height: g.s, animationDelay: `${g.dl}s`, animationDuration: `${g.du}s` }}
          />
        ))}
      </div>
      <div className="lift" aria-hidden="true">
        {GLOBOS.map((u, i) => (
          <div key={i} className="up" style={{ left: `${u.l}%`, width: u.w, animationDelay: `${u.dl}s`, animationDuration: `${u.du}s` }}>
            <Globo color={u.claro ? claro : color} />
          </div>
        ))}
      </div>
    </>
  );
}

/** Pantalla completa que aparece en el momento exacto de la revelación. */
export function Celebracion({ sexo, onCerrar }: { sexo: Sexo; onCerrar: () => void }) {
  return (
    <div className="celebra" role="dialog" aria-modal="true" aria-label={titulo(sexo)}>
      <Lluvia sexo={sexo} />
      <div className="celebra-in">
        <p className={`rv-t ${sexo === 'nina' ? 'pct-nina' : 'pct-nino'}`}>{titulo(sexo)}</p>
        <button type="button" className="btn btn-o celebra-btn" onClick={onCerrar}>
          Ver quién acertó
        </button>
      </div>
    </div>
  );
}
