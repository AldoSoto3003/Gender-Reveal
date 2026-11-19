import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { deviceId } from '../device';
import type { Api, Asistencia, Evento, FotoHistoria, FotoRecuerdo, MiAsistencia, Prediccion, Sexo } from '../types';

function revisar<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

function nombreArchivo(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
}

export function crearApiSupabase(url: string, anonKey: string, eventoId: string): Api {
  const sb: SupabaseClient = createClient(url, anonKey, {
    auth: { persistSession: true, detectSessionInUrl: true },
  });
  const dev = () => deviceId();
  const publica = (bucket: string, ruta: string) => sb.storage.from(bucket).getPublicUrl(ruta).data.publicUrl;

  async function firmada(bucket: string, ruta: string): Promise<string> {
    if (bucket !== 'recuerdos-pendientes') return publica(bucket, ruta);
    const r = await sb.storage.from(bucket).createSignedUrl(ruta, 60 * 60);
    return r.data?.signedUrl ?? '';
  }

  async function aRecuerdo(f: Omit<FotoRecuerdo, 'url'>): Promise<FotoRecuerdo> {
    return { ...f, url: await firmada(f.bucket, f.ruta) };
  }

  return {
    modo: 'supabase',

    async evento() {
      return revisar(await sb.from('eventos').select('*').eq('id', eventoId).single()) as Evento;
    },

    async predicciones() {
      return revisar(
        await sb.from('predicciones').select('id, nombre, prediccion, creado_en').eq('evento_id', eventoId).order('creado_en'),
      ) as Prediccion[];
    },

    async miPrediccion() {
      const rows = revisar(await sb.rpc('mi_prediccion', { p_evento: eventoId, p_device: dev() })) as
        | { nombre: string; prediccion: Sexo; peso_kg: number | null }[]
        | null;
      return rows?.[0] ?? null;
    },

    async guardarPrediccion(nombre, prediccion, pesoKg) {
      revisar(
        await sb.rpc('guardar_prediccion', {
          p_evento: eventoId,
          p_device: dev(),
          p_nombre: nombre,
          p_prediccion: prediccion,
          p_peso: pesoKg,
        }),
      );
    },

    async borrarPrediccion() {
      revisar(await sb.rpc('borrar_prediccion', { p_evento: eventoId, p_device: dev() }));
    },

    async miAsistencia() {
      const rows = revisar(await sb.rpc('mi_asistencia', { p_evento: eventoId, p_device: dev() })) as
        | MiAsistencia[]
        | null;
      return rows?.[0] ?? null;
    },

    async guardarAsistencia(a) {
      revisar(
        await sb.rpc('guardar_asistencia', {
          p_evento: eventoId,
          p_device: dev(),
          p_nombre: a.nombre,
          p_respuesta: a.respuesta,
          p_adultos: a.adultos,
          p_ninos: a.ninos,
          p_acompanantes: a.acompanantes,
          p_mensaje: a.mensaje,
        }),
      );
    },

    async fotosHistoria() {
      const rows = revisar(
        await sb.from('fotos_historia').select('id, ruta, titulo, tipo, posicion').eq('evento_id', eventoId).order('posicion'),
      ) as Omit<FotoHistoria, 'url'>[];
      return rows.map((f) => ({ ...f, url: publica('historia', f.ruta) }));
    },

    async recuerdosPublicados() {
      const rows = revisar(
        await sb
          .from('fotos_recuerdos')
          .select('id, ruta, bucket, subida_por, estado, creado_en')
          .eq('evento_id', eventoId)
          .eq('estado', 'publicada')
          .order('creado_en', { ascending: false }),
      ) as Omit<FotoRecuerdo, 'url'>[];
      return rows.map((f) => ({ ...f, url: publica(f.bucket, f.ruta) }));
    },

    async subirRecuerdo(archivo, nombre) {
      const ruta = `${eventoId}/${nombreArchivo()}`;
      revisar(await sb.storage.from('recuerdos-pendientes').upload(ruta, archivo, { contentType: 'image/jpeg' }));
      revisar(
        await sb.rpc('registrar_foto_recuerdo', { p_evento: eventoId, p_device: dev(), p_nombre: nombre, p_ruta: ruta }),
      );
    },

    escuchar(alCambiar) {
      const canal = sb
        .channel(`evento-${eventoId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos', filter: `id=eq.${eventoId}` }, () =>
          alCambiar('eventos'),
        )
        // Sin filtro por evento_id: Supabase no entrega los DELETE en suscripciones filtradas.
        // Al recibir cualquier cambio se vuelve a consultar, así que no importa de qué evento venga.
        .on('postgres_changes', { event: '*', schema: 'public', table: 'predicciones' }, () => alCambiar('predicciones'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fotos_recuerdos' }, () => alCambiar('fotos_recuerdos'))
        .subscribe();
      return () => {
        void sb.removeChannel(canal);
      };
    },

    async sesion() {
      const { data } = await sb.auth.getSession();
      const email = data.session?.user.email;
      if (!email) return null;
      const admin = revisar(await sb.rpc('soy_admin', { p_evento: eventoId })) as boolean;
      return { email, admin };
    },

    async entrar(email) {
      revisar(
        await sb.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/panel`, shouldCreateUser: true },
        }),
      );
    },

    async salir() {
      await sb.auth.signOut();
    },

    alCambiarSesion(cb) {
      const { data } = sb.auth.onAuthStateChange(() => cb());
      return () => data.subscription.unsubscribe();
    },

    async asistencias() {
      return revisar(
        await sb
          .from('asistencias')
          .select('id, nombre, respuesta, personas, adultos, ninos, acompanantes, mensaje, creado_en, actualizado_en')
          .eq('evento_id', eventoId)
          .order('actualizado_en', { ascending: false }),
      ) as Asistencia[];
    },

    async actualizarEvento(cambios) {
      revisar(await sb.from('eventos').update(cambios).eq('id', eventoId));
    },

    async subirFotoHistoria(archivo, titulo, tipo) {
      const ruta = `${eventoId}/${nombreArchivo()}`;
      revisar(await sb.storage.from('historia').upload(ruta, archivo, { contentType: 'image/jpeg' }));
      const actuales = revisar(await sb.from('fotos_historia').select('posicion').eq('evento_id', eventoId)) as {
        posicion: number;
      }[];
      const posicion = actuales.reduce((m, f) => Math.max(m, f.posicion), -1) + 1;
      revisar(await sb.from('fotos_historia').insert({ evento_id: eventoId, ruta, titulo, tipo, posicion }));
    },

    async editarFotoHistoria(id, cambios) {
      revisar(await sb.from('fotos_historia').update(cambios).eq('id', id));
    },

    async ordenarFotosHistoria(ids) {
      await Promise.all(ids.map((id, i) => sb.from('fotos_historia').update({ posicion: i }).eq('id', id)));
    },

    async borrarFotoHistoria(id) {
      const f = revisar(await sb.from('fotos_historia').select('ruta').eq('id', id).single()) as { ruta: string };
      revisar(await sb.from('fotos_historia').delete().eq('id', id));
      await sb.storage.from('historia').remove([f.ruta]);
    },

    async recuerdosTodos() {
      const rows = revisar(
        await sb
          .from('fotos_recuerdos')
          .select('id, ruta, bucket, subida_por, estado, creado_en')
          .eq('evento_id', eventoId)
          .neq('estado', 'quitada')
          .order('creado_en', { ascending: false }),
      ) as Omit<FotoRecuerdo, 'url'>[];
      return Promise.all(rows.map(aRecuerdo));
    },

    async subirRecuerdoAdmin(archivo) {
      const ruta = `${eventoId}/${nombreArchivo()}`;
      revisar(await sb.storage.from('recuerdos').upload(ruta, archivo, { contentType: 'image/jpeg' }));
      revisar(
        await sb
          .from('fotos_recuerdos')
          .insert({ evento_id: eventoId, ruta, bucket: 'recuerdos', subida_por: 'Los papás', estado: 'publicada' }),
      );
    },

    async aprobarRecuerdo(foto) {
      if (foto.bucket === 'recuerdos-pendientes') {
        revisar(
          await sb.storage.from('recuerdos-pendientes').move(foto.ruta, foto.ruta, { destinationBucket: 'recuerdos' }),
        );
      }
      revisar(await sb.from('fotos_recuerdos').update({ estado: 'publicada', bucket: 'recuerdos' }).eq('id', foto.id));
    },

    async quitarRecuerdo(foto) {
      await sb.storage.from(foto.bucket).remove([foto.ruta]);
      revisar(await sb.from('fotos_recuerdos').update({ estado: 'quitada' }).eq('id', foto.id));
    },

    async estadoSello() {
      const rows = revisar(await sb.rpc('estado_sello', { p_evento: eventoId })) as
        | { link_creado: boolean; sellado: boolean; sellado_en: string | null }[]
        | null;
      return rows?.[0] ?? { link_creado: false, sellado: false, sellado_en: null };
    },

    async crearLinkGuardian() {
      const rows = revisar(await sb.rpc('crear_link_guardian', { p_evento: eventoId })) as { token: string; pin: string }[];
      return rows[0];
    },

    async revelar() {
      return revisar(await sb.rpc('revelar', { p_evento: eventoId })) as Sexo;
    },

    async reiniciarPrueba() {
      revisar(await sb.rpc('reiniciar_prueba', { p_evento: eventoId }));
    },

    async guardianInfo(token) {
      const rows = revisar(await sb.rpc('guardian_info', { p_token: token })) as
        | { sellado: boolean; fecha_hora: string; revelado: boolean }[]
        | null;
      return rows?.[0] ?? null;
    },

    async sellar(token, pin, resultado) {
      revisar(await sb.rpc('sellar_resultado', { p_token: token, p_pin: pin, p_resultado: resultado }));
    },
  };
}
