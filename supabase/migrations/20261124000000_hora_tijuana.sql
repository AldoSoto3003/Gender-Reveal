-- El evento es en Tijuana: el "día del evento" para abrir las fotos se cuenta en hora de Tijuana.
create or replace function public.fotos_abiertas(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from eventos
    where id = e
      and invitados_suben_fotos
      and now() >= (date_trunc('day', fecha_hora at time zone 'America/Tijuana') at time zone 'America/Tijuana')
  );
$$;
