# Plan de trabajo

Hoy es el 19 de noviembre de 2026 y la fiesta es el **sábado 16 de enero de 2027**. La meta es mandar las invitaciones a más tardar el **7 de diciembre**, para que los invitados tengan casi 6 semanas.

## Etapas

| # | Etapa | Fechas | Entregable |
|---|---|---|---|
| 0 | Preparación | 20 al 23 nov | Repositorio, Vite, proyecto de Supabase, Nginx con HTTPS y despliegue automático al VPS |
| 1 | Invitación visual | 24 al 29 nov | Escena del sobre, tarjeta y todas las secciones con datos fijos |
| 2 | Datos reales | 30 nov al 3 dic | Migraciones, RLS, funciones, predicciones y confirmaciones funcionando |
| 3 | Panel básico | 3 al 6 dic | Login, confirmaciones con exportación y datos del evento |
| 4 | Lanzamiento de invitaciones | 7 dic | Dominio, imagen para WhatsApp y envío |
| 5 | Fotos y guardián | 8 al 20 dic | "Nuestra historia" desde el panel, ruta del guardián y sello |
| 6 | Revelación y recuerdos | 21 dic al 4 ene | Revelar en vivo, respaldo sin WebSocket, galería y aprobación |
| 7 | Ensayo general | 5 al 10 ene | Prueba con 20 celulares reales, incluido el navegador de WhatsApp |
| 8 | Congelamiento | 11 al 15 ene | Solo correcciones críticas; el guardián sella el resultado |
| 9 | Fiesta | 16 ene | Revelación en vivo y apertura de la galería |

Las etapas 5 y 6 pueden salir después de mandar la invitación: los invitados ven esas secciones primero en su estado "antes de la fiesta".

## Etapa 0: preparación

- [ ] `git init` y repositorio en GitHub
- [ ] Vite + React + TypeScript
- [ ] ESLint, Prettier y `tsc --noEmit` en CI
- [ ] Proyecto de Supabase y `.env.example`
- [ ] Registro DNS de `revelacion.aldosoto.dev`, Nginx y certificado HTTPS
- [ ] Despliegue automático al VPS con GitHub Actions (ver [06-despliegue.md](06-despliegue.md))

## Etapa 1: invitación visual

- [ ] Tokens de diseño y fuentes
- [ ] Componentes `Globo`, `Sello`, `Tarjeta` y `FotoImpresa`
- [ ] Escena del sobre con secuencia de apertura e inclinación
- [ ] Secciones: historia, predicción, conteo, detalles con mapas y confirmación, revelación y recuerdos
- [ ] Probar en iPhone Safari, Android Chrome y el navegador de WhatsApp

## Etapa 2: datos reales

- [ ] Migración inicial con tablas, RLS y funciones
- [ ] `device_id` en `localStorage`
- [ ] Predicciones con conteo en vivo
- [ ] Confirmaciones con "Cambiar mi respuesta"
- [ ] Pruebas de RLS: un invitado no puede leer `asistencias` ni `resultado_sellado`

## Etapa 3: panel básico

- [ ] Login con link mágico y tabla `admins`
- [ ] Resumen y confirmaciones con filtros, búsqueda y exportación
- [ ] Datos del evento con vista previa y links de mapas

## Etapa 4: lanzamiento

- [ ] Revisar HTTPS, caché y encabezados en `revelacion.aldosoto.dev`
- [ ] Imagen Open Graph y tarjeta estática (`/tarjeta`)
- [ ] Revisión final de textos con los datos reales
- [ ] Mandar el link por WhatsApp y la imagen a los invitados mayores

## Etapa 5: fotos y guardián

- [ ] Subida de fotos con reducción de tamaño y conversión de HEIC
- [ ] Reordenar, renombrar y quitar fotos en el panel
- [ ] Ruta del guardián con token y PIN; `estado_sello` en el panel

## Etapa 6: revelación y recuerdos

- [ ] Función `revelar` y confirmación de dos pasos
- [ ] Celebración en la invitación al recibir el cambio por Realtime
- [ ] Consulta cada 5 segundos como respaldo
- [ ] Subida de fotos de invitados, aprobación y galería

## Etapa 7: ensayo general

- [ ] Evento de prueba en Supabase, separado del real
- [ ] Revelar con 20 celulares conectados y medir el retraso (meta: menos de 1 segundo)
- [ ] Probar en el wifi del lugar, si es posible
- [ ] Revisar que el modo de movimiento reducido funcione

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Supabase gratuito pausa el proyecto tras 7 días sin actividad | Cron semanal en el VPS; considerar el plan Pro el mes del evento |
| El VPS se cae el día del evento | Monitor de disponibilidad y la versión compilada lista para subir a otro hosting estático en minutos |
| Mala señal en el salón | Respaldo por consulta periódica; la pantalla principal conectada por cable o con datos móviles |
| Filtros SVG lentos en celulares viejos | Pre-renderizar la tarjeta y los globos a PNG o WebP |
| Alguien intenta ver el resultado antes | El resultado nunca llega al navegador antes de revelar (ver arquitectura) |
| El guardián olvida sellar | El panel muestra el estado del sello y avisa si falta a 3 días del evento |
