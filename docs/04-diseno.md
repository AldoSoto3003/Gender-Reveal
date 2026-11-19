# Diseño

Referencia aprobada: página **Escena 3D con sobre** y **Panel privado** del canvas
https://claude.ai/artifact/P6cko31WDC8zCRJgR8xeek

## Dirección

Un objeto real sobre una mesa: sobre de papel gris azulado con sello de lacre dorado y, dentro, una tarjeta en papel de acuarela con globos rosa y azul, brillos dorados e hilos color oro. Inspirado en invitaciones impresas de papelería fina, no en una página web típica.

**Principios**

- **Realismo antes que decoración:** sombras de varias capas, texturas de papel y luz desde arriba a la izquierda.
- **Letra a mano solo para títulos y etiquetas**; el texto largo va en una sans legible para invitados mayores.
- **El dorado es acento:** brillos, hilos y sello. Nunca en texto.
- **Una sola gran animación:** la apertura del sobre. El resto del movimiento responde a lo que hace el invitado.

## Colores

| Token | Hex | Uso |
|---|---|---|
| `--mesa` | `#E6DFD5` | Fondo de la escena |
| `--papel` | `#F7F4EF` | Fondo de la página |
| `--papel-tarjeta` | `#FDFCFA` | Tarjetas y fotos impresas |
| `--tinta` | `#4E5A6E` | Títulos, botones y texto de la tarjeta |
| `--texto` | `#3F3A35` | Texto de párrafos |
| `--texto-suave` | `#6B6660` | Textos secundarios |
| `--globo-rosa` | `#F2A9A0` | Globo de niña |
| `--globo-azul` | `#9DB6DB` | Globo de niño |
| `--tinta-rosa` | `#C0504A` | Letras sobre globo rosa y "¡Es niña!" |
| `--tinta-azul` | `#34507A` | Letras sobre globo azul y "¡Es niño!" |
| `--oro` | `#C9A24E` | Base del dorado |
| `--sobre` | `#C9D1D9` | Solapa del sobre |
| `--sobre-sombra` | `#B6C0CA` | Pliegues del sobre |

Dorado metálico (degradado lineal a 45°): `#9C7424 → #E6C66F → #FFF1C1 → #CFA650 → #9E7528`.

Contraste verificado: `--tinta` sobre `--papel` da 6.1:1, y `--texto-suave` sobre `--papel` pasa AA.

## Tipografía

| Rol | Fuente | Tamaño (desktop / móvil) |
|---|---|---|
| Títulos de sección | Patrick Hand, mayúsculas, `letter-spacing: .05em` | 54 / 38 px |
| Etiquetas y botones | Patrick Hand, mayúsculas | 22 / 20 px |
| Texto | Figtree 400, 500 y 600 | 18 / 17 px |
| Números grandes | Patrick Hand | 128 / 80 px |

Ambas fuentes vienen de Google Fonts. Ninguna línea de texto en la página baja de 14 px; en la tarjeta, de 13 px en móvil.

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
