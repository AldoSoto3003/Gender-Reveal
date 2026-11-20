-- Los invitados solo pueden subir fotos a partir del día del evento (00:00 hora de CDMX).
-- Se valida aquí para que no se pueda saltar desde el navegador.

create or replace function public.fotos_abiertas(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from eventos
    where id = e
      and invitados_suben_fotos
      and now() >= (date_trunc('day', fecha_hora at time zone 'America/Mexico_City') at time zone 'America/Mexico_City')
  );
$$;

grant execute on function public.fotos_abiertas(uuid) to anon, authenticated;

create or replace function public.registrar_foto_recuerdo(
  p_evento uuid, p_device uuid, p_nombre text, p_ruta text
) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from eventos where id = p_evento and invitados_suben_fotos) then
    raise exception 'Por ahora no se pueden subir fotos';
  end if;
  if not public.fotos_abiertas(p_evento) then
    raise exception 'Las fotos se pueden subir a partir del día del evento';
  end if;
  if split_part(p_ruta, '/', 1) <> p_evento::text then raise exception 'Ruta inválida'; end if;
  if (select count(*) from fotos_recuerdos where evento_id = p_evento and device_hash = hash_device(p_device)) >= 30 then
    raise exception 'Llegaste al límite de 30 fotos';
  end if;

  insert into fotos_recuerdos (evento_id, ruta, bucket, subida_por, device_hash, estado)
  values (p_evento, p_ruta, 'recuerdos-pendientes', left(btrim(coalesce(p_nombre, '')), 60), hash_device(p_device), 'pendiente');
end $$;

-- El archivo tampoco se puede subir al bucket antes de tiempo.
drop policy if exists "pendientes invitados suben" on storage.objects;
create policy "pendientes invitados suben" on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'recuerdos-pendientes'
    and public.fotos_abiertas(public.uuid_o_nulo((storage.foldername(name))[1]))
  );
