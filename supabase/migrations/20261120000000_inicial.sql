-- Invitación de revelación de género: esquema inicial
-- Reglas clave:
--   * Los invitados solo escriben a través de funciones (RPC).
--   * resultado_sellado no tiene políticas de lectura: nadie puede leerla desde la API.
--   * eventos.resultado queda vacío hasta que un admin llama a revelar().

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  fecha_hora timestamptz not null,
  lugar text not null default '',
  direccion text not null default '',
  nota text not null default '',
  nombres_papas text not null default '',
  telefono text not null default '',
  estado text not null default 'pendiente' check (estado in ('pendiente', 'revelado')),
  resultado text check (resultado in ('nina', 'nino')),
  revelado_en timestamptz,
  galeria_visible boolean not null default false,
  invitados_suben_fotos boolean not null default true,
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now()
);

create table public.resultado_sellado (
  evento_id uuid primary key references public.eventos (id) on delete cascade,
  resultado text check (resultado in ('nina', 'nino')),
  guardian_token_hash text,
  guardian_pin_hash text,
  link_creado_en timestamptz,
  sellado_en timestamptz
);

create table public.predicciones (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  device_hash text not null,
  nombre text not null check (char_length(nombre) between 1 and 60),
  prediccion text not null check (prediccion in ('nina', 'nino')),
  peso_kg numeric(3, 2) check (peso_kg is null or peso_kg between 1 and 6),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (evento_id, device_hash)
);

create table public.asistencias (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  device_hash text not null,
  nombre text not null check (char_length(nombre) between 1 and 60),
  -- 'si' = viene, 'tal_vez' = aún no lo sabe, 'no' = no podrá ir
  respuesta text not null check (respuesta in ('si', 'tal_vez', 'no')),
  personas smallint not null,
  mensaje text not null default '' check (char_length(mensaje) <= 500),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (evento_id, device_hash),
  check ((respuesta in ('si', 'tal_vez') and personas between 1 and 8) or (respuesta = 'no' and personas = 0))
);

create table public.fotos_historia (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  ruta text not null,
  titulo text not null default '' check (char_length(titulo) <= 80),
  tipo text not null default 'foto' check (tipo in ('foto', 'ecografia')),
  posicion smallint not null default 0,
  creado_en timestamptz not null default now()
);

create table public.fotos_recuerdos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  ruta text not null,
  bucket text not null default 'recuerdos-pendientes',
  subida_por text not null default '' check (char_length(subida_por) <= 60),
  device_hash text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'publicada', 'quitada')),
  creado_en timestamptz not null default now()
);

create table public.admins (
  evento_id uuid not null references public.eventos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (evento_id, user_id)
);

create index on public.predicciones (evento_id);
create index on public.asistencias (evento_id);
create index on public.fotos_historia (evento_id, posicion);
create index on public.fotos_recuerdos (evento_id, estado);

-- ---------------------------------------------------------------------------
-- Funciones de apoyo
-- ---------------------------------------------------------------------------

create or replace function public.es_admin(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where evento_id = e and user_id = auth.uid());
$$;

create or replace function public.hash_device(d uuid) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(d::text, 'sha256'), 'hex');
$$;

create or replace function public.uuid_o_nulo(t text) returns uuid
language plpgsql immutable as $$
begin
  return t::uuid;
exception when others then
  return null;
end $$;

-- ---------------------------------------------------------------------------
-- Reglas de acceso (RLS)
-- ---------------------------------------------------------------------------

alter table public.eventos enable row level security;
alter table public.resultado_sellado enable row level security;
alter table public.predicciones enable row level security;
alter table public.asistencias enable row level security;
alter table public.fotos_historia enable row level security;
alter table public.fotos_recuerdos enable row level security;
alter table public.admins enable row level security;

-- eventos: todos leen; los admins editan solo los datos del evento (no estado ni resultado)
create policy "eventos lectura" on public.eventos for select using (true);
create policy "eventos edicion admin" on public.eventos for update to authenticated
  using (public.es_admin(id)) with check (public.es_admin(id));
revoke update on public.eventos from anon, authenticated;
grant update (fecha_hora, lugar, direccion, nota, nombres_papas, telefono, galeria_visible, invitados_suben_fotos)
  on public.eventos to authenticated;

-- resultado_sellado: sin políticas. Nadie lee ni escribe desde la API.
revoke all on public.resultado_sellado from anon, authenticated;

-- predicciones: lectura pública (nombre y predicción se muestran en la invitación)
create policy "predicciones lectura" on public.predicciones for select using (true);

-- asistencias: solo admins
create policy "asistencias admin" on public.asistencias for select to authenticated
  using (public.es_admin(evento_id));

-- fotos de la historia
create policy "historia lectura" on public.fotos_historia for select using (true);
create policy "historia admin escribe" on public.fotos_historia for all to authenticated
  using (public.es_admin(evento_id)) with check (public.es_admin(evento_id));

-- recuerdos: el público ve las publicadas; los admins ven y editan todo
create policy "recuerdos publicados" on public.fotos_recuerdos for select using (estado = 'publicada');
create policy "recuerdos admin lee" on public.fotos_recuerdos for select to authenticated
  using (public.es_admin(evento_id));
create policy "recuerdos admin edita" on public.fotos_recuerdos for update to authenticated
  using (public.es_admin(evento_id)) with check (public.es_admin(evento_id));
create policy "recuerdos admin borra" on public.fotos_recuerdos for delete to authenticated
  using (public.es_admin(evento_id));
create policy "recuerdos admin agrega" on public.fotos_recuerdos for insert to authenticated
  with check (public.es_admin(evento_id));

-- admins: cada quien ve su propia fila
create policy "admins propio" on public.admins for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RPC para invitados
-- ---------------------------------------------------------------------------

create or replace function public.guardar_prediccion(
  p_evento uuid, p_device uuid, p_nombre text, p_prediccion text, p_peso numeric default null
) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v_estado text;
begin
  select estado into v_estado from eventos where id = p_evento;
  if v_estado is null then raise exception 'Evento no encontrado'; end if;
  if v_estado <> 'pendiente' then raise exception 'Las predicciones ya están cerradas'; end if;

  insert into predicciones (evento_id, device_hash, nombre, prediccion, peso_kg)
  values (p_evento, hash_device(p_device), btrim(p_nombre), p_prediccion, p_peso)
  on conflict (evento_id, device_hash) do update
    set nombre = excluded.nombre,
        prediccion = excluded.prediccion,
        peso_kg = excluded.peso_kg,
        actualizado_en = now();
end $$;

create or replace function public.borrar_prediccion(p_evento uuid, p_device uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if exists (select 1 from eventos where id = p_evento and estado <> 'pendiente') then
    raise exception 'Las predicciones ya están cerradas';
  end if;
  delete from predicciones where evento_id = p_evento and device_hash = hash_device(p_device);
end $$;

create or replace function public.mi_prediccion(p_evento uuid, p_device uuid)
returns table (nombre text, prediccion text, peso_kg numeric)
language sql stable security definer set search_path = public, extensions as $$
  select nombre, prediccion, peso_kg from predicciones
  where evento_id = p_evento and device_hash = hash_device(p_device);
$$;

create or replace function public.guardar_asistencia(
  p_evento uuid, p_device uuid, p_nombre text, p_respuesta text, p_personas int, p_mensaje text default ''
) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from eventos where id = p_evento) then raise exception 'Evento no encontrado'; end if;

  insert into asistencias (evento_id, device_hash, nombre, respuesta, personas, mensaje)
  values (p_evento, hash_device(p_device), btrim(p_nombre), p_respuesta,
          case when p_respuesta = 'no' then 0 else p_personas end, coalesce(btrim(p_mensaje), ''))
  on conflict (evento_id, device_hash) do update
    set nombre = excluded.nombre,
        respuesta = excluded.respuesta,
        personas = excluded.personas,
        mensaje = excluded.mensaje,
        actualizado_en = now();
end $$;

create or replace function public.mi_asistencia(p_evento uuid, p_device uuid)
returns table (nombre text, respuesta text, personas smallint, mensaje text)
language sql stable security definer set search_path = public, extensions as $$
  select nombre, respuesta, personas, mensaje from asistencias
  where evento_id = p_evento and device_hash = hash_device(p_device);
$$;

create or replace function public.registrar_foto_recuerdo(
  p_evento uuid, p_device uuid, p_nombre text, p_ruta text
) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from eventos where id = p_evento and invitados_suben_fotos) then
    raise exception 'Por ahora no se pueden subir fotos';
  end if;
  if split_part(p_ruta, '/', 1) <> p_evento::text then raise exception 'Ruta inválida'; end if;
  if (select count(*) from fotos_recuerdos where evento_id = p_evento and device_hash = hash_device(p_device)) >= 30 then
    raise exception 'Llegaste al límite de 30 fotos';
  end if;

  insert into fotos_recuerdos (evento_id, ruta, bucket, subida_por, device_hash, estado)
  values (p_evento, p_ruta, 'recuerdos-pendientes', left(btrim(coalesce(p_nombre, '')), 60), hash_device(p_device), 'pendiente');
end $$;

-- ---------------------------------------------------------------------------
-- Guardián del sobre
-- ---------------------------------------------------------------------------

create or replace function public.crear_link_guardian(p_evento uuid)
returns table (token text, pin text)
language plpgsql security definer set search_path = public, extensions as $$
declare v_token text; v_pin text;
begin
  if not es_admin(p_evento) then raise exception 'No autorizado'; end if;
  v_token := encode(gen_random_bytes(18), 'hex');
  v_pin := lpad((floor(random() * 10000))::int::text, 4, '0');

  insert into resultado_sellado (evento_id, guardian_token_hash, guardian_pin_hash, link_creado_en)
  values (p_evento, encode(digest(v_token, 'sha256'), 'hex'), crypt(v_pin, gen_salt('bf')), now())
  on conflict (evento_id) do update
    set guardian_token_hash = excluded.guardian_token_hash,
        guardian_pin_hash = excluded.guardian_pin_hash,
        link_creado_en = now();

  return query select v_token, v_pin;
end $$;

create or replace function public.guardian_info(p_token text)
returns table (sellado boolean, fecha_hora timestamptz, revelado boolean)
language sql stable security definer set search_path = public, extensions as $$
  select r.resultado is not null, e.fecha_hora, e.estado = 'revelado'
  from resultado_sellado r join eventos e on e.id = r.evento_id
  where r.guardian_token_hash = encode(digest(p_token, 'sha256'), 'hex');
$$;

create or replace function public.sellar_resultado(p_token text, p_pin text, p_resultado text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare r resultado_sellado; e eventos;
begin
  if p_resultado not in ('nina', 'nino') then raise exception 'Resultado inválido'; end if;

  select * into r from resultado_sellado
  where guardian_token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if r.evento_id is null then raise exception 'Link inválido'; end if;
  if r.guardian_pin_hash is null or r.guardian_pin_hash <> crypt(p_pin, r.guardian_pin_hash) then
    raise exception 'PIN incorrecto';
  end if;

  select * into e from eventos where id = r.evento_id;
  if e.estado <> 'pendiente' then raise exception 'El resultado ya se reveló'; end if;
  if r.resultado is not null and not e.es_prueba and now() > e.fecha_hora - interval '24 hours' then
    raise exception 'Ya no se puede corregir: faltan menos de 24 horas';
  end if;

  update resultado_sellado set resultado = p_resultado, sellado_en = now() where evento_id = r.evento_id;
end $$;

-- ---------------------------------------------------------------------------
-- RPC para los papás
-- ---------------------------------------------------------------------------

create or replace function public.estado_sello(p_evento uuid)
returns table (link_creado boolean, sellado boolean, sellado_en timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not es_admin(p_evento) then raise exception 'No autorizado'; end if;
  return query
    select coalesce(r.guardian_token_hash is not null, false),
           coalesce(r.resultado is not null, false),
           r.sellado_en
    from (select 1) x
    left join resultado_sellado r on r.evento_id = p_evento;
end $$;

create or replace function public.revelar(p_evento uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  if not es_admin(p_evento) then raise exception 'No autorizado'; end if;
  select resultado into v from resultado_sellado where evento_id = p_evento;
  if v is null then raise exception 'El guardián todavía no sella el resultado'; end if;

  update eventos set resultado = v, estado = 'revelado', revelado_en = now()
  where id = p_evento and estado = 'pendiente';
  return v;
end $$;

-- Solo para eventos de prueba: deja todo como antes de revelar, para ensayar varias veces.
create or replace function public.reiniciar_prueba(p_evento uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin(p_evento) then raise exception 'No autorizado'; end if;
  if not exists (select 1 from eventos where id = p_evento and es_prueba) then
    raise exception 'Solo se puede reiniciar un evento de prueba';
  end if;
  update eventos set estado = 'pendiente', resultado = null, revelado_en = null where id = p_evento;
end $$;

create or replace function public.soy_admin(p_evento uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select es_admin(p_evento);
$$;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('historia', 'historia', true),
       ('recuerdos', 'recuerdos', true),
       ('recuerdos-pendientes', 'recuerdos-pendientes', false)
on conflict (id) do nothing;

create policy "historia admin" on storage.objects for all to authenticated
  using (bucket_id = 'historia' and public.es_admin(public.uuid_o_nulo((storage.foldername(name))[1])))
  with check (bucket_id = 'historia' and public.es_admin(public.uuid_o_nulo((storage.foldername(name))[1])));

create policy "recuerdos admin" on storage.objects for all to authenticated
  using (bucket_id = 'recuerdos' and public.es_admin(public.uuid_o_nulo((storage.foldername(name))[1])))
  with check (bucket_id = 'recuerdos' and public.es_admin(public.uuid_o_nulo((storage.foldername(name))[1])));

create policy "pendientes invitados suben" on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'recuerdos-pendientes'
    and exists (
      select 1 from public.eventos e
      where e.id = public.uuid_o_nulo((storage.foldername(name))[1]) and e.invitados_suben_fotos
    )
  );

create policy "pendientes admin" on storage.objects for all to authenticated
  using (bucket_id = 'recuerdos-pendientes' and public.es_admin(public.uuid_o_nulo((storage.foldername(name))[1])))
  with check (bucket_id = 'recuerdos-pendientes' and public.es_admin(public.uuid_o_nulo((storage.foldername(name))[1])));

-- ---------------------------------------------------------------------------
-- Tiempo real
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.eventos, public.predicciones, public.fotos_recuerdos;
