# Arquitectura

## Decisiones

| Tema | Decisión | Por qué |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Es el stack que ya dominamos; la página es una SPA pequeña |
| Backend | Supabase | Es Postgres y trae Realtime, Storage y Auth. Evita montar Django + Channels + Redis para un proyecto de dos meses |
| Lógica de servidor | Funciones SQL (`security definer`) llamadas por RPC | Las reglas sensibles (votar, confirmar, sellar, revelar) viven en la base de datos y no se pueden saltar desde el navegador |
| 3D del sobre | CSS 3D (`perspective`, `preserve-3d`) | Funciona fluido en celulares viejos y en el navegador interno de WhatsApp, sin cargar 600 KB de Three.js |
| Acuarela y papel | SVG con filtros (`feTurbulence`, `feDiffuseLighting`) | Se ve realista, escala sin pixelarse y pesa poco. Si el rendimiento falla en algún celular, se cambia por PNG pre-renderizados |
| Hosting de la página | VPS propio (Ubuntu + Nginx) en `revelacion.aldosoto.dev`, sin CI/CD | El VPS y el dominio ya existen. La página es estática: se clona, se compila en el VPS y Nginx sirve `dist/` |
| Datos | Supabase Cloud | La base de datos y el tiempo real deben ser confiables el día del evento; no conviene mantenerlos nosotros en el VPS para un evento único |

## Estructura del repositorio

```text
.
├── docs/                    Documentación
├── public/                  Íconos, imagen Open Graph, fuentes locales
├── src/
│   ├── app/                 Rutas y layout
│   ├── features/
│   │   ├── sobre/           Escena 3D y secuencia de apertura
│   │   ├── historia/        Fotos de "Nuestra historia"
│   │   ├── prediccion/      Formulario y conteo
│   │   ├── asistencia/      Confirmación (RSVP)
│   │   ├── revelacion/      Escucha en vivo y celebración
│   │   ├── recuerdos/       Galería y subida de fotos del día
│   │   ├── panel/           Panel de los papás
│   │   └── guardian/        Captura del resultado
│   ├── ui/                  Componentes compartidos (Globo, Boton, Foto, Sello)
│   ├── lib/
│   │   ├── supabase.ts      Cliente de Supabase
│   │   ├── device.ts        Identificador del dispositivo en localStorage
│   │   └── maps.ts          Links de Google Maps y Apple Maps
│   └── styles/              Tokens y estilos globales
├── supabase/
│   ├── migrations/          SQL versionado
│   └── seed.sql             Datos de prueba
├── .env.example
└── README.md
```

## Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Invitación |
| `/tarjeta` | Público | Tarjeta estática para WhatsApp e impresión |
| `/panel` | Papás (Supabase Auth) | Panel privado |
| `/guardian/:token` | Token + PIN | Captura del resultado |

## Seguridad del resultado

Es la parte más importante: **nadie debe poder ver el resultado antes de la revelación**, ni abriendo DevTools.

1. El guardián guarda el resultado con la función `sellar_resultado(token, pin, resultado)`.
2. El resultado vive en la tabla `resultado_sellado`, que **no tiene ninguna política de lectura**. Ni los invitados, ni los papás, ni la llave anónima pueden leerla.
3. El frontend nunca recibe el resultado mientras el evento no está revelado. La columna pública `eventos.resultado` está vacía hasta ese momento.
4. Al presionar **Revelar a todos**, la función `revelar()`:
   - verifica que quien la llama sea admin;
   - copia el resultado a `eventos.resultado`;
   - marca `eventos.estado = 'revelado'` y guarda `revelado_en`;
   - desde ese momento rechaza predicciones nuevas.
5. Realtime avisa a todas las pantallas del cambio en `eventos`.

El modo **ensayo** del panel es solo visual: elige un resultado al azar en el navegador y no toca la base de datos.

## Tiempo real

Canal de Supabase Realtime sobre la tabla `eventos` (fila del evento) y `predicciones` (inserciones y cambios).

```ts
supabase
  .channel('evento')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'eventos', filter: `id=eq.${EVENT_ID}` }, onEvento)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'predicciones', filter: `evento_id=eq.${EVENT_ID}` }, onPrediccion)
  .subscribe();
```

**Respaldo:** si el WebSocket se cae (redes de salón de eventos), la página consulta el estado del evento cada 5 segundos a partir de 10 minutos antes de la hora programada.

## Identidad de los invitados

No hay cuentas. Al primer uso se genera un `device_id` (UUID) que se guarda en `localStorage`.

- Las funciones `guardar_prediccion` y `guardar_asistencia` reciben el `device_id` y hacen *upsert*; así el invitado puede cambiar su respuesta.
- Si borra los datos del navegador, se registra como nuevo. Es aceptable para este evento.
- Para evitar abuso: límite de 5 escrituras por minuto por `device_id`, y, si hace falta, Cloudflare Turnstile en los formularios.

## Fotos

| Uso | Bucket | Lectura | Escritura |
|---|---|---|---|
| Nuestra historia | `historia` | Pública | Solo papás |
| Recuerdos aprobados | `recuerdos/publicadas` | Pública | Solo papás (al aprobar) |
| Recuerdos de invitados | `recuerdos/pendientes` | Solo papás | Cualquiera, máximo 10 MB y solo imágenes |

- Las fotos se reducen en el navegador antes de subir (lado mayor de 2000 px, JPEG al 82%).
- Las HEIC del iPhone se convierten a JPEG en el navegador.
- Al aprobar, la función mueve el archivo de `pendientes/` a `publicadas/` y cambia su estado.

## WhatsApp e invitados mayores

- **Vista previa del link:** etiquetas Open Graph con la imagen de la tarjeta (`/og.png`, 1200 × 630).
- **Imagen para mandar:** `/tarjeta` renderiza la tarjeta en tamaño 1080 × 1350. Se captura con un script de Playwright (`npm run tarjeta`) que genera `tarjeta.png` para compartirla como imagen.

## Despliegue

```text
git push ─► en el VPS: ./deploy/actualizar.sh (git pull + npm ci + build) ─► Nginx sirve dist/ en revelacion.aldosoto.dev
                                                                                  │
                                                         el navegador habla directo con Supabase Cloud
```

El detalle está en [06-despliegue.md](06-despliegue.md).

## Rendimiento

- Objetivo: la página es interactiva en menos de 2.5 segundos en 4G, en un celular de gama media.
- Fuentes con `font-display: swap` y precarga de Patrick Hand.
- Los filtros SVG pesados (relieve del papel) se aplican solo en la tarjeta y se pre-renderizan a imagen si afectan el rendimiento.
- Se respeta `prefers-reduced-motion`: sin animaciones, el sobre arranca abierto.
