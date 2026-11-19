-- Crea el evento real y uno de prueba. Corre esto una vez en el SQL Editor de Supabase.
-- Copia el id del evento real a VITE_EVENT_ID.

insert into public.eventos (id, fecha_hora, lugar, direccion, nombres_papas, es_prueba)
values
  ('6f1c2a8e-0b7d-4c1e-9a55-2d3f7e8b1c01', '2027-01-16 16:00:00-06', '', '', '', false),
  ('6f1c2a8e-0b7d-4c1e-9a55-2d3f7e8b1c99', '2027-01-16 16:00:00-06', 'Evento de prueba', 'Zócalo, Ciudad de México', 'Mamá y Papá', true)
on conflict (id) do nothing;

-- Después de que cada papá entre una vez a /panel con su correo, dalos de alta como admins:
--
-- insert into public.admins (evento_id, user_id)
-- select e.id, u.id
-- from public.eventos e
-- cross join auth.users u
-- where u.email in ('correo-papa@ejemplo.com', 'correo-mama@ejemplo.com');
