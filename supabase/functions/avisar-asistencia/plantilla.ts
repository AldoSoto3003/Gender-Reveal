// Plantilla del correo de aviso. Sin dependencias de Deno para poder generar la vista previa
// en local (scripts/vista-correo.ts). Usa tablas y estilos en línea porque así lo exigen
// los clientes de correo (Gmail, Outlook, Apple Mail).

export type Respuesta = 'si' | 'tal_vez' | 'no';
export type Tema = 'neutro' | 'clasico';

export interface Asistencia {
  nombre: string;
  respuesta: Respuesta;
  personas: number;
  adultos: number;
  ninos: number;
  acompanantes: string;
  mensaje: string;
}

export interface Totales {
  si: number;
  tal: number;
  no: number;
}

/** Los mismos colores que la página (src/styles/base.css). */
const PALETAS: Record<Tema, Record<string, string>> = {
  neutro: {
    papel: '#F2F0E3', mesa: '#E8E6D2', linea: '#DCDAC8', tinta: '#2C3624', suave: '#59624D', tenue: '#6F7765',
    nina: '#845F06', nino: '#46652E', claroNina: '#F3D98D', claroNino: '#CFDCBC', boton: '#F6F4E8',
  },
  clasico: {
    papel: '#F7F4EF', mesa: '#E9E2D8', linea: '#E2DCD3', tinta: '#3B4558', suave: '#5F6573', tenue: '#737885',
    nina: '#B2443E', nino: '#34507A', claroNina: '#F7D4CF', claroNino: '#CFDCEF', boton: '#FBF8F3',
  },
};

const DISPLAY = "'Bricolage Grotesque','Avenir Next','Segoe UI',Helvetica,Arial,sans-serif";
const SANS = "'Figtree','Segoe UI',Helvetica,Arial,sans-serif";

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function desglose(a: Asistencia): string {
  const p = ['quien confirmó'];
  if (a.adultos) p.push(plural(a.adultos, 'adulto', 'adultos'));
  if (a.ninos) p.push(plural(a.ninos, 'niño', 'niños'));
  return p.length === 1 ? 'solo quien confirmó' : `${p.slice(0, -1).join(', ')} y ${p[p.length - 1]}`;
}

export function asunto(a: Asistencia, anterior: Respuesta | null): string {
  const cambio = anterior && anterior !== a.respuesta;
  if (a.respuesta === 'si') return `${a.nombre} ${cambio ? 'ahora sí viene' : 'viene'}: ${plural(a.personas, 'persona', 'personas')}`;
  if (a.respuesta === 'tal_vez') return `${a.nombre} ${cambio ? 'ahora' : 'todavía'} no sabe si viene`;
  return `${a.nombre} ${cambio ? 'ya no podrá ir' : 'no podrá ir'}`;
}

export function armarCorreo(
  a: Asistencia,
  anterior: Respuesta | null,
  t: Totales,
  tema: Tema,
  panelUrl: string,
): { asunto: string; html: string } {
  const c = PALETAS[tema];
  const cambio = !!anterior && anterior !== a.respuesta;
  const edicion = !!anterior && anterior === a.respuesta;

  const estado: Record<Respuesta, { titulo: string; chip: string; fondo: string; texto: string }> = {
    si: { titulo: `${a.nombre} viene`, chip: 'Sí viene', fondo: c.claroNino, texto: c.nino },
    tal_vez: { titulo: `${a.nombre} aún no lo sabe`, chip: 'Tal vez', fondo: c.claroNina, texto: c.nina },
    no: { titulo: `${a.nombre} no podrá ir`, chip: 'No viene', fondo: c.mesa, texto: c.suave },
  };
  const e = estado[a.respuesta];
  const textoAnterior: Record<Respuesta, string> = { si: 'sí venía', tal_vez: 'no sabía', no: 'no venía' };
  const eyebrow = cambio ? 'Cambió su respuesta' : edicion ? 'Actualizó su confirmación' : 'Nueva confirmación';

  const filas: [string, string][] = [];
  if (a.respuesta !== 'no') {
    filas.push(['Personas', `${plural(a.personas, 'persona', 'personas')} · ${desglose(a)}`]);
    if (a.acompanantes) filas.push(['Acompañantes', a.acompanantes]);
  }
  if (cambio) filas.push(['Antes', `Decía que ${textoAnterior[anterior!]}`]);

  const fila = ([k, v]: [string, string]) => `
        <tr>
          <td style="padding:14px 0;border-top:1px solid ${c.linea};font:700 11px/1.4 ${SANS};letter-spacing:.16em;text-transform:uppercase;color:${c.tenue};width:130px;vertical-align:top">${esc(k)}</td>
          <td style="padding:14px 0;border-top:1px solid ${c.linea};font:600 16px/1.45 ${SANS};color:${c.tinta}">${esc(v)}</td>
        </tr>`;

  const total = (n: number, l: string, color: string) => `
          <td width="33%" style="padding:0 6px 0 0;vertical-align:top">
            <div style="font:800 34px/1 ${DISPLAY};letter-spacing:-.03em;color:${color}">${n}</div>
            <div style="font:700 11px/1.4 ${SANS};letter-spacing:.14em;text-transform:uppercase;color:${c.tenue};padding-top:6px">${l}</div>
          </td>`;

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(asunto(a, anterior))}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${c.papel}">
<div style="display:none;max-height:0;overflow:hidden">${esc(asunto(a, anterior))}${a.mensaje ? ` · “${esc(a.mensaje)}”` : ''}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.papel}">
  <tr><td align="center" style="padding:32px 20px 40px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px">
      <tr><td style="padding-bottom:28px;border-bottom:1px solid ${c.linea}">
        <span style="font:800 17px/1 ${DISPLAY};letter-spacing:-.02em;color:${c.nina}">Niña</span><span style="font:400 15px/1 ${DISPLAY};color:${c.tenue}"> o </span><span style="font:800 17px/1 ${DISPLAY};letter-spacing:-.02em;color:${c.nino}">niño</span>
      </td></tr>

      <tr><td style="padding-top:32px">
        <div style="font:700 12px/1.4 ${SANS};letter-spacing:.2em;text-transform:uppercase;color:${c.tenue}">${eyebrow}</div>
        <h1 style="margin:12px 0 0;font:800 40px/1.02 ${DISPLAY};letter-spacing:-.035em;color:${c.tinta}">${esc(e.titulo)}</h1>
        <div style="margin-top:18px">
          <span style="display:inline-block;padding:8px 16px;border-radius:999px;background:${e.fondo};font:700 14px/1 ${SANS};color:${e.texto}">${e.chip}${a.respuesta !== 'no' ? ` · ${plural(a.personas, 'persona', 'personas')}` : ''}</span>
        </div>
      </td></tr>

      ${
        a.mensaje
          ? `<tr><td style="padding-top:28px">
        <div style="font:700 11px/1.4 ${SANS};letter-spacing:.16em;text-transform:uppercase;color:${c.tenue}">Su mensaje</div>
        <p style="margin:8px 0 0;font:700 22px/1.35 ${DISPLAY};letter-spacing:-.015em;color:${c.tinta}">“${esc(a.mensaje)}”</p>
      </td></tr>`
          : ''
      }

      ${
        filas.length
          ? `<tr><td style="padding-top:28px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filas.map(fila).join('')}
        </table>
      </td></tr>`
          : ''
      }

      <tr><td style="padding-top:36px">
        <div style="font:700 12px/1.4 ${SANS};letter-spacing:.2em;text-transform:uppercase;color:${c.tenue};padding-bottom:14px">Así van las confirmaciones</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>${total(t.si, t.si === 1 ? 'Persona viene' : 'Personas vienen', c.nino)}${total(t.tal, 'Tal vez', c.nina)}${total(t.no, t.no === 1 ? 'No viene' : 'No vienen', c.suave)}
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding-top:36px">
        <a href="${panelUrl}" style="display:inline-block;padding:15px 26px;border-radius:999px;background:${c.tinta};font:600 15px/1 ${SANS};color:${c.boton};text-decoration:none">Ver todas en el panel</a>
      </td></tr>

      <tr><td style="padding-top:40px;border-bottom:1px solid ${c.linea}"></td></tr>
      <tr><td style="padding-top:16px;font:400 13px/1.5 ${SANS};color:${c.tenue}">
        Te llega porque tienes acceso al panel de la revelación. Llega un aviso cada vez que alguien confirma o cambia su respuesta.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { asunto: asunto(a, anterior), html };
}
