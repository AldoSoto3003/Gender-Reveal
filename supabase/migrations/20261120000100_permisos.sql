-- Los proyectos nuevos de Supabase ya no dan permisos automáticos sobre las tablas de `public`
-- a los roles de la API. Aquí se otorgan explícitamente; las políticas RLS siguen decidiendo
-- qué filas ve o cambia cada quien.

grant usage on schema public to anon, authenticated;

-- Lectura pública (las políticas RLS filtran las filas)
grant select on public.eventos, public.predicciones, public.fotos_historia, public.fotos_recuerdos
  to anon, authenticated;

-- Solo usuarios con sesión (y RLS exige que sean admins del evento)
grant select on public.asistencias, public.admins to authenticated;
grant insert, update, delete on public.fotos_historia to authenticated;
grant insert, update, delete on public.fotos_recuerdos to authenticated;

-- eventos: los admins editan solo estas columnas (estado y resultado cambian únicamente con revelar())
revoke update on public.eventos from anon, authenticated;
grant update (fecha_hora, lugar, direccion, nota, nombres_papas, telefono, galeria_visible, invitados_suben_fotos)
  on public.eventos to authenticated;

-- resultado_sellado: nadie, nunca, desde la API
revoke all on public.resultado_sellado from anon, authenticated;
