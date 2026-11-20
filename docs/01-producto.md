# Producto y flujos

## Objetivo

Una invitación que se sienta como recibir un sobre de verdad, que haga participar a los invitados antes de la fiesta (predicciones) y que el día del evento muestre el resultado en vivo en todas las pantallas al mismo tiempo, incluidas las de quienes no pudieron ir.

## Personas

| Rol | Cómo entra | Qué puede hacer |
|---|---|---|
| Invitado | Link por WhatsApp, sin cuenta | Abrir el sobre, ver la historia, predecir, confirmar asistencia, subir fotos del día |
| Papás (admin) | `/panel`, con correo y contraseña | Ver confirmaciones, editar datos del evento, administrar fotos, revelar |
| Guardián | Link único `/guardian/:token` con PIN | Capturar el resultado del sobre del doctor una sola vez |
| Invitado mayor | Imagen por WhatsApp | Ver la tarjeta estática con los datos; confirmar por teléfono si lo prefiere |

## Invitación (`/`)

Una sola página con scroll. Las secciones van en este orden.

### 1. Escena del sobre

1. Al cargar, un sobre cae sobre una mesa con textura de lino y proyecta su sombra.
2. El sello de lacre dorado pulsa y abajo aparece "Toca el sello para abrir tu invitación" junto con el botón **Abrir invitación**.
3. El sobre se abre tocando el sello, cualquier parte del sobre o el botón.
4. Secuencia de apertura: el sello se suelta, la solapa gira en 3D y muestra el forro, la tarjeta sale del sobre, el sobre se va hacia abajo y la tarjeta queda al frente.
5. Con el mouse (o la inclinación del celular, opcional), el sobre y la tarjeta se inclinan ligeramente.
6. Debajo de la tarjeta aparece "Desliza para ver más".

**Regla:** si el invitado ya abrió el sobre antes (se guarda en `localStorage`), la página arranca con la tarjeta ya abierta, con opción de "Ver el sobre otra vez".

### 2. Nuestra historia hasta ahora

- De 1 a 12 fotos subidas por los papás (ecografías, pancita, el cuarto), con título.
- Se muestran como fotos impresas con marco blanco, ligeramente giradas y con cinta adhesiva.
- Al tocar una, se levanta y se ve de cerca.

### 3. ¿Qué crees que será?

- Campos: nombre (obligatorio), predicción tocando el globo de **niña** o de **niño** (obligatorio) y peso al nacer (opcional).
- Tras enviar: "¡Gracias, Ana! Tu predicción: niña." con opción de **Cambiar mi predicción**.
- Una predicción por dispositivo (token en `localStorage`), editable hasta la revelación.
- Las predicciones se cierran solas al revelar.

### 4. Así van las predicciones

- Porcentaje de niña y de niño en tiempo real.
- Lista de nombres por equipo. Los votos nuevos aparecen al instante (Realtime).

### 5. Los detalles

- Fecha, hora, lugar y dirección, configurables desde el panel.
- Botones **Abrir en Google Maps** y **Abrir en Apple Maps**, generados con la dirección.
- **Confirma tu asistencia:**
  - Nombre (se llena solo si ya votó).
  - ¿Vienes? **Sí, ahí estaré**, **Aún no lo sé** o **No podré ir**.
  - Si viene o aún no sabe: **¿Quién viene contigo?** con contadores de adultos (además de él) y niños, y los nombres de los acompañantes (opcional). Se muestra el total, por ejemplo "4 personas (tú, 1 adulto y 2 niños)".
  - Con "Aún no lo sé" se muestra: "Te apartamos lugar para N personas. Cuando lo sepas, vuelve aquí y cambia tu respuesta".
  - Mensaje para los papás (opcional).
  - Al enviar: "¡Listo, Ana! Te esperamos. Confirmaste 3 personas." con opción de **Cambiar mi respuesta**.

### 6. El 16 de enero abrimos el sobre

- **Antes:** explica que el resultado aparecerá aquí en vivo.
- **Al revelar (Realtime):** suben globos del color ganador, cae brillo dorado y aparece "¡Es niña!" o "¡Es niño!", con cuántos acertaron, sus nombres y si el invitado acertó.
- No existe un ensayo público en producción; el ensayo vive en el panel.

### 7. Recuerdos del 16 de enero

- **Antes de la fiesta:** fotos apiladas con candado y "Se abre el 16 de enero".
- **Cuando los papás la activan:** galería en mosaico con quién subió cada foto y el botón **Subir mis fotos**.
- Las fotos de invitados quedan pendientes hasta que los papás las aprueben.

### 8. Pie

"Con cariño, [nombres]" y **Ver el sobre otra vez**.

## Panel de los papás (`/panel`)

Acceso con correo y contraseña de cualquiera de los dos papás (se pueden cambiar desde el panel). En el celular, el menú se convierte en pestañas arriba.

| Sección | Contenido |
|---|---|
| Resumen | Personas que vienen, cuántos no podrán ir, número de predicciones, fotos del día, últimas confirmaciones y barra niña/niño |
| Confirmaciones | Lista con nombre, respuesta, total de personas, acompañantes (adultos, niños y nombres), mensaje y fecha. Filtros (todas, vienen, tal vez, no vienen), búsqueda por nombre, total de personas y descarga en Excel o CSV |
| Datos del evento | Fecha, hora, lugar, dirección y nota. Vista previa de la tarjeta y links de mapas generados con botón para probarlos |
| Nuestra historia | Subir fotos (JPG, PNG o HEIC), editar títulos, reordenar y quitar |
| Recuerdos del día | Interruptores para mostrar la galería y para permitir fotos de invitados. Fotos por aprobar y publicadas |
| La revelación | Estado del sello del guardián, link del guardián y botón **Revelar a todos** con confirmación de dos pasos. Incluye un modo ensayo que no afecta a los invitados |

## Guardián (`/guardian/:token`)

1. El guardián abre su link y escribe el PIN que le dieron los papás.
2. Elige **Niña** o **Niño** y confirma dos veces.
3. Ve "Resultado sellado. No se lo digas a nadie 🤫" y ya no puede volver a verlo.
4. Puede corregirlo hasta 24 horas antes del evento; después queda bloqueado.

## Tarjeta estática (`/tarjeta`)

- La tarjeta en acuarela a pantalla completa, sin interacción, lista para captura o impresión.
- La misma imagen se usa como vista previa del link en WhatsApp (Open Graph).
- Incluye la dirección y un teléfono para confirmar, pensado para quienes no usan la página.

## Día de la fiesta

1. Proyectar la invitación en una pantalla grande con la tarjeta abierta.
2. A la hora acordada, uno de los papás presiona **Revelar a todos** en su celular.
3. Todas las pantallas muestran el resultado en menos de 1 segundo.
4. Al mismo tiempo se abre la caja o se corta el pastel.
5. Después, se activa **Recuerdos del día** para que todos suban sus fotos.

## Fuera de alcance (por ahora)

- Cuentas de usuario para invitados.
- Varios eventos en la misma instalación (el modelo de datos ya lo permite).
- Notificaciones por correo o WhatsApp automáticas.
