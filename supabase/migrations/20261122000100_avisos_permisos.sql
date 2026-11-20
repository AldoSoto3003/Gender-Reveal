-- La Edge Function avisar-asistencia usa la llave de servicio. Los proyectos nuevos de Supabase
-- no le dan acceso automático a las tablas, así que se otorga solo lo que necesita.
grant usage on schema public to service_role;
grant select on public.asistencias, public.admins, public.eventos to service_role;
grant update (avisado_en) on public.asistencias to service_role;
