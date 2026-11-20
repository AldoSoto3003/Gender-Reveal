// Manda un correo a los papás (todos los admins del evento) cada vez que alguien
// confirma, cambia o rechaza su asistencia. La llama un trigger de la base (ver la
// migración 20261122000000_avisos_asistencia.sql) con { id, anterior }.
//
// No necesita secreto compartido: solo recibe el id, lee la fila con la llave de servicio
// y manda el correo una sola vez por cambio (marca avisado_en). Llamarla de más no
// genera correos repetidos ni permite mandar texto inventado.
//
// Secretos (npx supabase secrets set ...):
//   RESEND_API_KEY   llave de Resend con permiso de envío
//   AVISO_REMITENTE  opcional, por defecto "Revelación <avisos@aldosoto.dev>"
//   PANEL_URL        opcional, por defecto "https://revelacion.aldosoto.dev/panel"
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

type Respuesta = 'si' | 'tal_vez' | 'no';

interface Fila {
  id: string;
  evento_id: string;
  nombre: string;
  respuesta: Respuesta;
  personas: number;
  adultos: number;
  ninos: number;
  acompanantes: string;
  mensaje: string;
  actualizado_en: string;
  avisado_en: string | null;
}

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});
const RESEND = Deno.env.get('RESEND_API_KEY');
const REMITENTE = Deno.env.get('AVISO_REMITENTE') ?? 'Revelación <avisos@aldosoto.dev>';
const PANEL = Deno.env.get('PANEL_URL') ?? 'https://revelacion.aldosoto.dev/panel';

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function quienes(f: Fila): string {
  const partes: string[] = [];
  if (f.adultos) partes.push(plural(f.adultos, 'adulto', 'adultos'));
  if (f.ninos) partes.push(plural(f.ninos, 'niño', 'niños'));
  return partes.length ? `con ${partes.join(' y ')}` : 'sola o solo';
}

function asunto(f: Fila, anterior: Respuesta | null): string {
  const cambio = anterior && anterior !== f.respuesta;
  if (f.respuesta === 'si') return `${f.nombre} ${cambio ? 'ahora sí viene' : 'viene'}: ${plural(f.personas, 'persona', 'personas')}`;
  if (f.respuesta === 'tal_vez') return `${f.nombre} ${cambio ? 'ahora' : 'todavía'} no sabe si viene`;
  return `${f.nombre} ${cambio ? 'ya no podrá ir' : 'no podrá ir'}`;
}

function cuerpo(f: Fila, anterior: Respuesta | null, t: { si: number; tal: number; no: number }): string {
  const texto: Record<Respuesta, string> = { si: 'Sí viene', tal_vez: 'Aún no lo sabe', no: 'No podrá ir' };
  const filas: [string, string][] = [['Respuesta', texto[f.respuesta]]];
  if (anterior && anterior !== f.respuesta) filas.push(['Antes', texto[anterior]]);
  else if (anterior) filas.push(['Cambio', 'Actualizó sus datos']);
  if (f.respuesta !== 'no') {
    filas.push(['Personas', `${plural(f.personas, 'persona', 'personas')} (${quienes(f)})`]);
    if (f.acompanantes) filas.push(['Acompañantes', f.acompanantes]);
  }
  if (f.mensaje) filas.push(['Mensaje', `“${f.mensaje}”`]);

  return `<!doctype html><html lang="es"><body style="margin:0;background:#f2f0e3;font-family:Arial,Helvetica,sans-serif;color:#2c3624">
<div style="max-width:520px;margin:0 auto;padding:28px 20px">
  <p style="margin:0;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#6f7765">Confirmación de asistencia</p>
  <h1 style="margin:8px 0 20px;font-size:24px;line-height:1.2">${esc(asunto(f, anterior))}</h1>
  <table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px">
    ${filas
      .map(
        ([k, v]) =>
          `<tr><td style="padding:10px 0;border-bottom:1px solid #dcdac8;color:#6f7765;width:120px;vertical-align:top">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #dcdac8;font-weight:bold">${esc(v)}</td></tr>`,
      )
      .join('')}
  </table>
  <p style="margin:24px 0 6px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#6f7765">Cómo van</p>
  <p style="margin:0;font-size:15px">Vienen <b>${plural(t.si, 'persona', 'personas')}</b> · tal vez ${t.tal} · no vienen ${t.no}</p>
  <p style="margin:28px 0 0"><a href="${PANEL}" style="display:inline-block;background:#2c3624;color:#f6f4e8;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px">Ver todas en el panel</a></p>
</div></body></html>`;
}

async function correosDeAdmins(eventoId: string): Promise<string[]> {
  const { data, error } = await sb.from('admins').select('user_id').eq('evento_id', eventoId);
  if (error) throw error;
  const correos: string[] = [];
  for (const { user_id } of data ?? []) {
    const { data: u } = await sb.auth.admin.getUserById(user_id);
    if (u?.user?.email) correos.push(u.user.email);
  }
  return correos;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Método no permitido', { status: 405 });
  if (!RESEND) return new Response('Falta RESEND_API_KEY', { status: 500 });

  let id = '';
  let anterior: Respuesta | null = null;
  try {
    const b = await req.json();
    id = String(b.id ?? '');
    if (['si', 'tal_vez', 'no'].includes(b.anterior)) anterior = b.anterior;
  } catch {
    return new Response('Cuerpo inválido', { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('id inválido', { status: 400 });

  const { data: f, error } = await sb.from('asistencias').select('*').eq('id', id).maybeSingle<Fila>();
  if (error) return new Response(error.message, { status: 500 });
  if (!f) return new Response('No existe', { status: 404 });

  // Una sola vez por cambio: si ya se avisó de esta versión de la fila, no hace nada.
  if (f.avisado_en && Date.parse(f.avisado_en) >= Date.parse(f.actualizado_en)) {
    return new Response('Ya avisado', { status: 200 });
  }
  const { data: marcada } = await sb
    .from('asistencias')
    .update({ avisado_en: new Date().toISOString() })
    .eq('id', id)
    .eq('actualizado_en', f.actualizado_en)
    .select('id');
  if (!marcada?.length) return new Response('Cambió mientras tanto', { status: 200 });

  const para = await correosDeAdmins(f.evento_id);
  if (!para.length) return new Response('Sin admins', { status: 200 });

  const { data: todas } = await sb.from('asistencias').select('respuesta, personas').eq('evento_id', f.evento_id);
  const t = { si: 0, tal: 0, no: 0 };
  for (const a of todas ?? []) {
    if (a.respuesta === 'si') t.si += a.personas;
    else if (a.respuesta === 'tal_vez') t.tal += a.personas;
    else t.no += 1;
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: REMITENTE, to: para, subject: asunto(f, anterior), html: cuerpo(f, anterior, t) }),
  });
  if (!r.ok) {
    // Se quita la marca para que el siguiente cambio vuelva a intentar.
    await sb.from('asistencias').update({ avisado_en: null }).eq('id', id);
    return new Response(`Resend respondió ${r.status}: ${await r.text()}`, { status: 502 });
  }
  return new Response('Enviado', { status: 200 });
});
