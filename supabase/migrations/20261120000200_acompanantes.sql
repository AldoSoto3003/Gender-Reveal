-- Acompañantes: además de quien confirma, cuántos adultos y niños vienen con él y sus nombres.
-- personas = 1 (quien confirma) + adultos + niños.

alter table public.asistencias
  add column adultos smallint not null default 0 check (adultos between 0 and 10),
  add column ninos smallint not null default 0 check (ninos between 0 and 10),
  add column acompanantes text not null default '' check (char_length(acompanantes) <= 300);

-- Las filas existentes: todo lo que pasaba de 1 persona se cuenta como adultos acompañantes.
update public.asistencias set adultos = greatest(personas - 1, 0) where respuesta <> 'no';

alter table public.asistencias drop constraint if exists asistencias_check;
alter table public.asistencias add constraint asistencias_personas_check check (
  (respuesta in ('si', 'tal_vez') and personas = 1 + adultos + ninos)
  or (respuesta = 'no' and personas = 0 and adultos = 0 and ninos = 0)
);

drop function if exists public.guardar_asistencia(uuid, uuid, text, text, int, text);

create or replace function public.guardar_asistencia(
  p_evento uuid, p_device uuid, p_nombre text, p_respuesta text,
  p_adultos int default 0, p_ninos int default 0, p_acompanantes text default '', p_mensaje text default ''
) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_adultos int := case when p_respuesta = 'no' then 0 else greatest(coalesce(p_adultos, 0), 0) end;
  v_ninos int := case when p_respuesta = 'no' then 0 else greatest(coalesce(p_ninos, 0), 0) end;
begin
  if not exists (select 1 from eventos where id = p_evento) then raise exception 'Evento no encontrado'; end if;

  insert into asistencias (evento_id, device_hash, nombre, respuesta, adultos, ninos, acompanantes, personas, mensaje)
  values (
    p_evento, hash_device(p_device), btrim(p_nombre), p_respuesta, v_adultos, v_ninos,
    case when p_respuesta = 'no' then '' else coalesce(btrim(p_acompanantes), '') end,
    case when p_respuesta = 'no' then 0 else 1 + v_adultos + v_ninos end,
    coalesce(btrim(p_mensaje), '')
  )
  on conflict (evento_id, device_hash) do update
    set nombre = excluded.nombre,
        respuesta = excluded.respuesta,
        adultos = excluded.adultos,
        ninos = excluded.ninos,
        acompanantes = excluded.acompanantes,
        personas = excluded.personas,
        mensaje = excluded.mensaje,
        actualizado_en = now();
end $$;

drop function if exists public.mi_asistencia(uuid, uuid);

create or replace function public.mi_asistencia(p_evento uuid, p_device uuid)
returns table (nombre text, respuesta text, adultos smallint, ninos smallint, acompanantes text, personas smallint, mensaje text)
language sql stable security definer set search_path = public, extensions as $$
  select nombre, respuesta, adultos, ninos, acompanantes, personas, mensaje from asistencias
  where evento_id = p_evento and device_hash = hash_device(p_device);
$$;

grant execute on function public.guardar_asistencia(uuid, uuid, text, text, int, int, text, text) to anon, authenticated;
grant execute on function public.mi_asistencia(uuid, uuid) to anon, authenticated;
