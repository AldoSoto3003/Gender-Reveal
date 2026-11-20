-- Aviso por correo a los papás cada vez que alguien confirma, cambia o rechaza su asistencia.
-- El trigger llama a la Edge Function "avisar-asistencia" con pg_net (asíncrono: si el correo
-- falla, la confirmación del invitado se guarda igual).

create extension if not exists pg_net with schema extensions;

-- Cuándo se avisó por última vez de esta fila (evita correos repetidos).
alter table public.asistencias add column if not exists avisado_en timestamptz;

create or replace function public.avisar_asistencia() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://zfgauxphwnmqqnfbeyjh.supabase.co/functions/v1/avisar-asistencia',
    body := jsonb_build_object('id', new.id, 'anterior', case when tg_op = 'UPDATE' then old.respuesta end),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 5000
  );
  return new;
end $$;

drop trigger if exists asistencias_aviso_nueva on public.asistencias;
create trigger asistencias_aviso_nueva
  after insert on public.asistencias
  for each row execute function public.avisar_asistencia();

drop trigger if exists asistencias_aviso_cambio on public.asistencias;
create trigger asistencias_aviso_cambio
  after update of nombre, respuesta, personas, adultos, ninos, acompanantes, mensaje on public.asistencias
  for each row
  when (
    old.respuesta is distinct from new.respuesta
    or old.personas is distinct from new.personas
    or old.adultos is distinct from new.adultos
    or old.ninos is distinct from new.ninos
    or old.acompanantes is distinct from new.acompanantes
    or old.mensaje is distinct from new.mensaje
    or old.nombre is distinct from new.nombre
  )
  execute function public.avisar_asistencia();
