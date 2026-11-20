# Modelo de datos

Postgres en Supabase. Todas las tablas tienen RLS activado. Los invitados solo escriben a través de funciones (RPC); nunca insertan directo en las tablas.

## Diagrama

```text
eventos 1 ─── 1 resultado_sellado        (privada, sin lectura)
   │
   ├── * predicciones
   ├── * asistencias
   ├── * fotos_historia
   ├── * fotos_recuerdos
   └── * admins ─── auth.users
```

## Tablas

### `eventos`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `fecha_hora` | `timestamptz` | 2027-01-16 14:00 America/Tijuana |
| `lugar` | `text` | Nombre del lugar |
| `direccion` | `text` | Se usa para los links de mapas |
| `nota` | `text` | Opcional |
| `nombres_papas` | `text` | Como aparecen en la tarjeta |
| `estado` | `text` | `'pendiente'` o `'revelado'` |
| `resultado` | `text` | `null` hasta revelar; luego `'nina'` o `'nino'` |
| `revelado_en` | `timestamptz` | |
| `galeria_visible` | `boolean` | Muestra "Recuerdos del día" |
| `tema` | `text` | Colores de la invitación: `neutro` (miel y salvia) o `clasico` (rosa y azul). Lo cambian los papás desde el panel |
| `invitados_suben_fotos` | `boolean` | |

### `resultado_sellado` (privada)

| Columna | Tipo | Notas |
|---|---|---|
| `evento_id` | `uuid` PK, FK | |
| `resultado` | `text` | `'nina'` o `'nino'` |
| `guardian_token` | `text` | Hash del token del link |
| `guardian_pin` | `text` | Hash del PIN |
| `sellado_en` | `timestamptz` | |

### `predicciones`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `evento_id` | `uuid` FK | |
| `device_hash` | `text` | Hash del `device_id`; único por evento |
| `nombre` | `text` | 1 a 60 caracteres |
| `prediccion` | `text` | `'nina'` o `'nino'` |
| `peso_kg` | `numeric(3,2)` | Opcional, entre 1 y 6 |
| `creado_en` | `timestamptz` | |

### `asistencias`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `evento_id` | `uuid` FK | |
| `device_hash` | `text` | Hash del `device_id`; único por evento |
| `nombre` | `text` | |
| `respuesta` | `text` | `'si'`, `'tal_vez'` (aún no lo sabe) o `'no'` |
| `adultos` | `smallint` | Adultos que acompañan a quien confirma (0 a 10) |
| `ninos` | `smallint` | Niños que lo acompañan (0 a 10) |
| `acompanantes` | `text` | Nombres de los acompañantes, opcional |
| `personas` | `smallint` | `1 + adultos + ninos` si es `si` o `tal_vez`; 0 si es `no` (lo calcula la función) |
| `mensaje` | `text` | Opcional, máximo 500 caracteres |
| `creado_en`, `actualizado_en` | `timestamptz` | |

### `fotos_historia`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `evento_id` | `uuid` FK | |
| `ruta` | `text` | Ruta en Storage |
| `titulo` | `text` | |
| `tipo` | `text` | `'foto'` o `'ecografia'` |
| `posicion` | `smallint` | Orden en la invitación |

### `fotos_recuerdos`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `evento_id` | `uuid` FK | |
| `ruta` | `text` | |
| `subida_por` | `text` | Nombre de quien la subió |
| `device_id` | `uuid` | |
| `estado` | `text` | `'pendiente'`, `'publicada'` o `'quitada'` |
| `creado_en` | `timestamptz` | |

### `admins`

| Columna | Tipo |
|---|---|
| `evento_id` | `uuid` FK |
| `user_id` | `uuid` FK a `auth.users` |

## Reglas de acceso (RLS)

| Tabla | Invitado (anon) | Papás (admin) |
|---|---|---|
| `eventos` | Leer | Leer y editar (excepto `estado`, `resultado`) |
| `resultado_sellado` | Nada | Nada |
| `predicciones` | Leer `nombre` y `prediccion` | Leer todo |
| `asistencias` | Nada | Leer todo |
| `fotos_historia` | Leer | Todo |
| `fotos_recuerdos` | Leer solo `publicada` | Todo |
| `admins` | Nada | Leer la suya |

Función de apoyo:

```sql
create function es_admin(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where evento_id = e and user_id = auth.uid());
$$;
```

## Funciones (RPC)

Todas son `security definer`, validan sus datos y fijan `search_path`.

| Función | Quién | Qué hace |
|---|---|---|
| `guardar_prediccion(evento, device, nombre, prediccion, peso)` | Invitado | *Upsert* por `device_id`. Falla si el evento ya se reveló |
| `borrar_prediccion(evento, device)` | Invitado | Para "Cambiar mi predicción" |
| `guardar_asistencia(evento, device, nombre, respuesta, adultos, ninos, acompanantes, mensaje)` | Invitado | *Upsert* por `device_id` |
| `mi_asistencia(evento, device)` | Invitado | Devuelve su propia respuesta para mostrarla al volver |
| `registrar_foto_recuerdo(evento, device, nombre, ruta)` | Invitado | Crea la foto como `pendiente` si el evento lo permite |
| `sellar_resultado(token, pin, resultado)` | Guardián | Guarda o corrige el resultado hasta 24 horas antes del evento |
| `estado_sello(evento)` | Papás | Devuelve si ya está sellado y cuándo, **nunca el resultado** |
| `revelar(evento)` | Papás | Copia el resultado a `eventos`, cambia el estado y cierra las predicciones |
| `aprobar_foto(id)` y `quitar_foto(id)` | Papás | Cambian el estado y mueven el archivo |

Ejemplo de `revelar`:

```sql
create function revelar(e uuid) returns text
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  if not es_admin(e) then raise exception 'No autorizado'; end if;
  select resultado into r from resultado_sellado where evento_id = e;
  if r is null then raise exception 'El guardián todavía no sella el resultado'; end if;
  update eventos
     set resultado = r, estado = 'revelado', revelado_en = now()
   where id = e and estado = 'pendiente';
  return r;
end $$;
```

## Conteos

- Los porcentajes de predicciones se calculan en el navegador a partir de `predicciones`.
- Los totales de asistencia (vienen, tal vez y no) se calculan en el panel a partir de `asistencias`.

## Alta del evento y los admins

1. Corre la migración [`supabase/migrations/20261120000000_inicial.sql`](../supabase/migrations/20261120000000_inicial.sql).
2. Corre [`supabase/seed.sql`](../supabase/seed.sql): crea el evento real y uno de prueba (`es_prueba = true`, se puede reiniciar para ensayar).
3. Crea el usuario de cada papá con su contraseña (ver abajo).
4. Corre el `insert into admins` que está comentado al final de `seed.sql`, con sus correos.

### Usuarios y contraseñas del panel

El panel se abre con correo y contraseña; la app no permite registrarse. Ya dentro, cada quien puede cambiar la suya en **Cambiar contraseña** (abajo en el menú).

- **Usuario nuevo:** en Supabase, *Authentication → Users → Add user → Create new user*, con su correo, una contraseña y **Auto Confirm User** marcado.
- **Usuario que ya existía (antes se entraba con link al correo) o contraseña olvidada:** en *SQL Editor*:

  ```sql
  update auth.users
  set encrypted_password = extensions.crypt('LA_CONTRASEÑA', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where email = 'correo@ejemplo.com';
  ```

  Para ver quiénes existen y si ya son admins:

  ```sql
  select u.email, u.email_confirmed_at is not null as confirmado, a.user_id is not null as admin
  from auth.users u left join public.admins a on a.user_id = u.id;
  ```

> Permisos: los proyectos nuevos de Supabase ya no dan acceso automático a las tablas. La migración [`20261120000100_permisos.sql`](../supabase/migrations/20261120000100_permisos.sql) otorga los `GRANT` necesarios a `anon` y `authenticated`; las políticas RLS siguen decidiendo qué filas ve cada quien.

> Nota de implementación: en la base de datos no se guarda el `device_id` del invitado, sino su hash SHA-256 (`device_hash`). Así, aunque las predicciones son de lectura pública, nadie puede usar ese valor para cambiar el voto de otra persona.

## Exportar confirmaciones

El panel arma el archivo en el navegador con los datos de `asistencias` (columnas: nombre, respuesta, personas, mensaje y fecha) y lo descarga como `.csv` con acentos compatibles con Excel.
