# Marca sampcity: guía de diseño

Referencia para cualquier diseño nuevo (logos, banners, tienda, anuncios, tarjetas del bot).
Antes de diseñar algo, leer esta guía y mirar `marca/_resumen.png` y `marca/manual-de-marca-A4.png`.

## Lo que le gusta al dueño (y lo que no)

- **Sí:** estilo GTA. Letras **minúsculas, anchas y cuadradas**, dos tonos (**"samp" rosa + "city" rojo**),
  **contorno negro grueso**. Con **volumen**: extrusión 3D, bisel/brillo arriba, trama de puntos tipo cómic,
  sombra proyectada, destellos. La referencia que mandó es la base del logo actual.
- **No:** diseños **planos**, sin profundidad ni tipografías llamativas (se rechazó la primera propuesta:
  monograma "SC" plano, emblema y neón plano, `historial/sampcity-presentacion.png`).
- **No poner "ROLEPLAY"** en los logos.
- Los íconos se entregan en **PNG** (varios tamaños).
- Siempre en español.

Historial de propuestas en `historial/`: v1 plana (rechazada), v2 3D con otras tipografías (`v2-presentacion.png`),
v3 estilo GTA (`v3-*`, la elegida) y la moneda CityCoins de Tebex (`citycoin*.png`).

## Logotipo

- Tipografía: **Russo One** (`fonts/RussoOne-Regular.ttf`, SIL OFL, se puede usar en la marca). Textos y piezas: Poppins.
- Construcción (función `wordmark` de `scripts/marca.js`): tamaño 300, `letterSpacing -6px`, inclinación -0.06,
  extrusión de 26 capas hacia abajo-derecha, contorno exterior 0.2 del tamaño y 0.075 en el frente, "negrita"
  con trazo del mismo color (0.05), brillo en el 40 % superior, trama de puntos en la parte baja, borde interior claro.
- Variantes (`marca/logo-*.png`, fondo transparente): `principal`, `principal-TM`, `plano` (sin 3D, como la referencia,
  para tamaños pequeños o textdraws), `apilado`, `blanco` (fondos oscuros), `oscuro` (fondos claros),
  `cromo_rojo`, `oro`, `neon` (ediciones especiales: VIP, eventos).

## Colores

| Uso | Hex |
|---|---|
| Rosa "samp" | `#F59D99` (degradado `#FFC9C4` → `#C65856`) |
| Rojo "city" | `#E8392F` (degradado `#FF9A86` → `#9E150F`) |
| Granate / extrusión | `#9E150F`, `#B3241C` → `#3A0806` |
| Contorno | `#0A0202` |
| Blanco | `#FFFFFF` |

Escena de fondo de los banners: atardecer de Los Santos (`#1A0612` → `#5A0F1F` → `#D9442F` → `#FFB35C`), rayos de sol,
dos planos de edificios con ventanas encendidas y palmeras en silueta.

## Íconos

`marca/icono-cuadrado-N.png` (recuadro redondeado) y `marca/icono-circular-N.png` (Discord) en 1024, 512, 256, 128,
64, 48, 32 y 16 px. Letras "sc" en el mismo estilo del logo. Sin fondo: `icono-letras-transparente.png` y `-blanco.png`.
Probar siempre a 32 px (barra lateral de Discord).

## Marcas de agua

`marca/marca-de-agua-blanca.png` (40 %), `-oscura.png`, `-color.png` y `marca-de-agua-patron-1920x1080.png`
(patrón diagonal al 12 % para proteger capturas). Ejemplos: `marca/ejemplo-marca-de-agua-*.png`.

## Banners y otras piezas

- `marca/banner-1920x1080.png` y `marca/banner-discord-960x540.png`.
- Tienda Tebex: moneda **CityCoins** y paquetes 100 / 500 / 1000 (`historial/citycoin*.png`, `scripts/citycoins.js`).
- Tarjetas de bienvenida/despedida del bot: `src/assets/utils/welcomeCard.js` (paleta atardecer, Poppins).

## Registro de marca (resumen de lo que se le explicó)

- Colombia: **Superintendencia de Industria y Comercio (SIC)**, trámite en línea. Registrar la **marca mixta**
  (nombre + logo). Clases de Niza: **41** (entretenimiento / juegos en línea), **9** (software y bienes virtuales),
  **35** opcional (venta en línea). Tasa por clase (descuento MiPyme), unos 6-8 meses, vigencia 10 años renovable.
- Usar **™** mientras está en trámite y **®** solo cuando esté registrada.
- Riesgo: "SAMP" (nombre del mod SA-MP) y "city" son genéricos; la palabra sola puede ser objetada, por eso la
  marca mixta. Hacer búsqueda de antecedentes y consultar a un abogado de propiedad intelectual.

## Referencias del género (investigación)

Logos de servidores SA-MP / GTA RP: clones del logo de GTA (Pricedown), emblemas con skyline y palmeras,
neón/synthwave, monogramas. Errores típicos: demasiado detalle para 32-48 px, texto largo en el ícono, copiar la
composición de Rockstar, poco contraste. Pricedown (Ray Larabie) es gratis para logos en imagen, pero no se usa
para no parecer un clon de GTA.

## Regenerar

```
node branding/scripts/marca.js       # todo branding/marca
node branding/scripts/citycoins.js   # moneda y paquetes CityCoins en branding/historial
```

Las fuentes están en `fonts/` (Google Fonts, licencia SIL OFL en `fonts/OFL.txt`; Luckiest Guy es Apache 2.0).
