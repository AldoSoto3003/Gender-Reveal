# Diseño

Referencia aprobada: página **Escena 3D con sobre** y **Panel privado** del canvas
https://claude.ai/artifact/P6cko31WDC8zCRJgR8xeek

## Dirección

Un sobre de papel verde salvia con sello de lacre dorado y, dentro, una invitación moderna en un solo lienzo color avena, con globos de acuarela miel (niña) y salvia (niño), brillos dorados e hilos color oro.

**Principios**

- **Un solo lienzo:** nada de hojas o tarjetas encimadas; las secciones se separan con aire, líneas finas y tipografía.
- **Tipografía grande y moderna para títulos**; el texto largo va en una sans legible para invitados mayores.
- **El dorado es acento:** brillos, hilos y sello. Nunca en texto.
- **Una sola gran animación:** la apertura del sobre. El resto del movimiento responde a lo que hace el invitado.

## Colores

Paleta neutra sin azules ni rosas: avena, olivo, miel (niña) y salvia (niño). Los tokens viven en `src/styles/base.css`.

| Token | Hex | Uso |
|---|---|---|
| `--papel` | `#F2F0E3` | Fondo de toda la invitación (un solo lienzo) |
| `--mesa` | `#E8E6D2` | Bandas sutiles y fondo de la tarjeta estática |
| `--campo` | olivo al 6% | Fondo de campos, chips y botones secundarios |
| `--tinta` | `#2C3624` | Títulos, texto y botones |
| `--texto-suave` | `#59624D` | Textos secundarios |
| `--globo-nina` | `#E3B23C` | Globo y barra de niña (miel) |
| `--globo-nino` | `#9FB583` | Globo y barra de niño (salvia) |
| `--tinta-nina` | `#845F06` | Texto "Niña" y "¡Es niña!" |
| `--tinta-nino` | `#46652E` | Texto "Niño" y "¡Es niño!" |
| `--oro` | `#C9A24E` | Brillos, hilos y sello |
| sobre | `#CDD2B1` | Papel del sobre (salvia) |

### Tema "Rosa y azul"

Desde el panel (**Datos del evento → Colores de la invitación**) los papás pueden cambiar a la paleta rosa (niña) y azul (niño). Se guarda en `eventos.tema` (`neutro` o `clasico`) y todos los invitados la ven al momento. Los mismos tokens se redefinen bajo `:root[data-tema='clasico']` en `base.css`; los SVG toman el color de las variables CSS y las ilustraciones del sobre tienen una versión `-clasico.svg`.

Las secciones no usan hojas ni tarjetas encimadas: se separan con aire, una línea de 1 px y tipografía.

## Tipografía

| Rol | Fuente | Tamaño |
|---|---|---|
| Títulos y números grandes | Bricolage Grotesque 700–800, `letter-spacing` negativo | 34–60 px (secciones), hasta 220 px (fecha) |
| Etiquetas | Figtree 600–700, mayúsculas, `letter-spacing: .2em` | 12–13 px |
| Texto y botones | Figtree 400–600 | 16–18 px |

## Componentes

| Componente | Descripción |
|---|---|
| `Sobre` | Capas en CSS 3D: fondo interior, tarjeta, bolsillo (SVG), solapa con dos caras y sello |
| `Sello` | Lacre dorado con borde irregular, anillo en relieve, "?" grabado y brillo |
| `Tarjeta` | SVG de 600 × 840 con relieve de papel, 6 globos y 4 hilos dorados |
| `Globo` | Símbolo SVG reutilizable: forma, filtro de acuarela con bordes de pigmento, brillos blancos y 55 puntos dorados. El color entra por `currentColor` |
| `FotoImpresa` | Marco blanco, giro de −3° a 3°, sombra de tres capas y cinta adhesiva opcional |
| `Boton` | Píldora color `--tinta` con Patrick Hand en mayúsculas; variante con contorno. Mínimo 56 px de alto |
| `Campo` | Solo línea inferior de 2 px; etiqueta arriba en 15 px |
| `Interruptor`, `Chip`, `Tabla` | Componentes del panel |

## Animaciones

### Entrada y apertura del sobre

| Momento | Duración | Curva |
|---|---|---|
| El sobre cae sobre la mesa y aparece su sombra | 1.5 s (empieza a los 0.2 s) | `cubic-bezier(.2,.75,.25,1)` |
| Aparece la indicación "Toca el sello" | 0.8 s (empieza a los 1.9 s) | `ease` |
| El sello se suelta | 0.35 s | `cubic-bezier(.3,0,.2,1)` |
| La solapa gira 180° | 1.05 s (empieza a los 0.25 s) | `cubic-bezier(.5,0,.2,1)` |
| La tarjeta sale 56% hacia arriba | 1.2 s (empieza a los 0.95 s) | `cubic-bezier(.3,0,.2,1)` |
| El sobre se va hacia abajo | 1 s (a los 2.3 s) | `cubic-bezier(.55,0,.75,.2)` |
| La tarjeta pasa al frente | 1.2 s (a los 2.3 s) | `cubic-bezier(.2,.8,.2,1)` |

### Otras

- **Inclinación con el mouse:** hasta ±10° en X y ±12° en Y, con transición de 0.7 s.
- **Globo elegido:** sube 24 px y se mece ±3° cada 3.2 s.
- **Revelación:** 15 globos suben en 4 a 6 s y caen 46 brillos dorados.
- **`prefers-reduced-motion`:** sin animaciones; el sobre aparece abierto.

## Responsivo

- Punto de quiebre en 760 px.
- **Escena:** 960 px de alto en desktop y 700 px en móvil. El sobre mide 400 px de ancho en desktop y 262 px en móvil; la tarjeta abierta, 520 px y 330 px.
- **Fotos:** 3 columnas en desktop y 2 en móvil. **Galería de recuerdos:** mosaico de 3 y 2 columnas.
- **Panel:** menú lateral en desktop y pestañas con scroll horizontal en móvil.

## Accesibilidad

- El sobre siempre tiene el botón **Abrir invitación** como alternativa al gesto.
- La tarjeta SVG tiene `role="img"` y un `aria-label` con el texto completo de la invitación.
- Los botones de elección usan `aria-pressed`; los interruptores, `role="switch"`.
- Foco visible en todo: contorno de 2 px color `--tinta`.
- Áreas táctiles de al menos 44 × 44 px.
