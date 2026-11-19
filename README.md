# Invitación de revelación de género

Invitación web para la revelación de género del **sábado 16 de enero de 2027**. Los invitados abren un sobre en 3D, ven la tarjeta, hacen su predicción (niña o niño), confirman asistencia y, el día de la fiesta, ven el resultado en vivo al mismo tiempo que todos.

Nadie conoce el resultado antes de la fiesta, ni siquiera los papás. Un **guardián** captura lo que dice el sobre del doctor y los papás lo revelan desde su panel.

## Qué incluye

| Parte | Para quién | Qué hace |
|---|---|---|
| Invitación (`/`) | Invitados | Sobre 3D, tarjeta en acuarela, historia en fotos, predicción, confirmación, mapas, revelación en vivo y recuerdos del día |
| Panel (`/panel`) | Papás | Confirmaciones, datos del evento, fotos, aprobación de recuerdos y botón de revelar |
| Guardián (`/guardian/:token`) | Una persona de confianza | Captura el resultado del sobre del doctor, sin que nadie más lo vea |
| Tarjeta (`/tarjeta`) | Invitados mayores | Versión estática para mandar como imagen por WhatsApp e imprimir |

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (Postgres, Realtime, Storage, Auth)
- **Hosting:** VPS propio (Ubuntu + Nginx) en **https://revelacion.aldosoto.dev**, con despliegue automático desde GitHub Actions
- **Datos:** Supabase Cloud (plan gratuito al inicio)

El porqué de cada decisión está en [docs/02-arquitectura.md](docs/02-arquitectura.md).

## Documentación

1. [Producto y flujos](docs/01-producto.md): qué hace cada pantalla y cómo se usa.
2. [Arquitectura](docs/02-arquitectura.md): stack, rutas, tiempo real y seguridad del resultado.
3. [Modelo de datos](docs/03-modelo-de-datos.md): tablas, reglas de acceso (RLS) y funciones.
4. [Diseño](docs/04-diseno.md): colores, tipografía, componentes y animaciones.
5. [Plan de trabajo](docs/05-plan-de-trabajo.md): etapas y fechas hasta el 16 de enero.
6. [Despliegue](docs/06-despliegue.md): DNS, Nginx, HTTPS y GitHub Actions hacia el VPS.

## Diseño de referencia

El diseño aprobado vive en un canvas privado de Claude, en la página **Escena 3D con sobre** (invitación) y **Panel privado**:
https://claude.ai/artifact/P6cko31WDC8zCRJgR8xeek

## Desarrollo local

Requiere Node 20 o más reciente.

```bash
npm install
```

```bash
npm run dev
```

Abre http://localhost:5173.

### Modo demo

Si no hay variables de Supabase, la app corre en **modo demo**: los datos (votos, confirmaciones, fotos) se guardan en el `localStorage` del navegador y se sincronizan entre pestañas. Sirve para probar todo sin backend:

1. `/`: la invitación (aparece un aviso amarillo de "Modo demo").
2. `/guardian/demo` con el PIN `1234`: sella el resultado.
3. `/panel`: entra directo, sin login. En **La revelación**, presiona **Revelar a todos** y mira la otra pestaña.
4. Para volver a empezar: en el panel, **Reiniciar evento de prueba**, o borra el `localStorage` del sitio.

### Con Supabase

```bash
cp .env.example .env.local
```

| Variable | Uso |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Llave pública (anon) de Supabase |
| `VITE_EVENT_ID` | ID del evento (ver `supabase/seed.sql`) |

La migración está en [`supabase/migrations`](supabase/migrations) y los pasos para crear el evento y los admins en [docs/03-modelo-de-datos.md](docs/03-modelo-de-datos.md#alta-del-evento-y-los-admins).

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run typecheck` | Revisión de tipos con TypeScript |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve la versión compilada |

### Estructura

```text
src/
├── App.tsx               Rutas
├── pages/                Invitación, Panel, Guardián y Tarjeta
├── features/             Secciones (sobre, historia, predicción, asistencia, revelación, recuerdos, panel)
├── ui/                   Tarjeta, Globo y definiciones SVG (acuarela, papel, dorado, sello)
├── hooks/                Carga de datos y tiempo real
├── lib/api/              Contrato de datos: Supabase y modo demo
└── styles/               CSS base, invitación y panel
supabase/                 Migración SQL y datos iniciales
deploy/nginx/             Configuración de Nginx
.github/workflows/        Despliegue automático al VPS
```

## Datos pendientes

- Hora exacta, nombre del lugar y dirección
- Nombres de los papás como aparecerán en la tarjeta
- Quién será el guardián del sobre
- Fotos reales para la sección "Nuestra historia"
