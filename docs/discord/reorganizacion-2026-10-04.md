# Discord de SampCity: verificación, tickets y reorganización · 04/10/2026

Pedido del dueño: verificarse en el Discord solo con la cuenta del juego (desde la web) y con el apodo del personaje;
tickets más completos y fáciles de encontrar; y reorganizar todo el servidor para que deje de parecerse a la plantilla
(nombres, mensajes, normas y estilo).

## 1. Verificación con la cuenta del juego

1. En el canal 「🔐」verificacion el botón **Verificarme en la web** lleva a `WEB_URL/verificar` (repo Web).
2. Ahí se inicia sesión con `Nombre_Apellido` y la contraseña del juego, y se pulsa **Vincular con Discord** (OAuth,
   solo lee el usuario y el ID). Queda en `discord_links`.
3. El bot (`src/handlers/functions/verificacion.js`, cada 30 s) ve el enlace: da **👤 USUARIO**, cambia el apodo por el
   nombre de la cuenta y manda un MD. Si alguien se cambia el apodo, se lo vuelve a poner.
4. Quien **no** está vinculado no está verificado: con `VERIFICACION=on` se le quita el rol, también a los que se
   verificaron antes con el captcha (ya no existe). No se toca a los administradores ni a los bots.
   Con `VERIFICACION=suave` se dan rol y apodo pero no se quita a nadie (útil unos días para avisar antes).
5. **Ya me vinculé** comprueba al momento sin esperar. `!vincular` con código en el juego sigue funcionando.

Al dueño del servidor Discord no deja cambiarle el apodo, y el rol del bot tiene que estar por encima de 👤 USUARIO y de
los miembros para poder cambiar apodos.

## 2. Tickets

- Panel en 「🎫」soporte con un menú de 8 tipos (`src/assets/data/tickets.js`): ayuda general, no puedo verificarme,
  reportar a un jugador, reportar un fallo, apelar una sanción, tienda/VIP/CityCoins, facciones y bandas, alianzas y
  creadores. Cada tipo tiene su formulario.
- El canal (`「🚨」reporte-0007`…) lo ven el autor, 🎫 SOPORTE y, según el tipo, los rangos de staff que tocan
  (reportes: Moderador+, apelaciones: Moderador Global+, tienda: Administrador+). Muestra las respuestas y la cuenta del
  juego vinculada (nivel y advertencias).
- Botones: **Atender**, **Prioridad** (normal/alta/urgente), **Cerrar** (con motivo), **Transcripción**, **Avisar**.
- Al cerrar: transcripción al canal de registros y al autor por MD, con estrellas para **valorar** la atención (1-5).
- Solos: aviso a las 48 h sin mensajes, cierre a las 72 h y borrado del canal cerrado a las 24 h (`TICKETS_*_H`).
- `/tickets stats`: tickets por tipo, valoración media, tiempo de primera respuesta y quién atiende más.
- Los que aún no se verificaron también pueden abrir tickets.

## 3. Reorganización (`/reorganizar vista` y `/reorganizar aplicar`)

Plano en `src/assets/data/serverLayout.js`. Nuevo estilo: categorías `✦ NOMBRE` y canales `「emoji」nombre`.

| Categoría | Quién la ve | Canales |
|---|---|---|
| ✦ EMPIEZA AQUÍ | Todos | bienvenidas, verificacion, normas, soporte, primeros-pasos |
| ✦ TICKETS ABIERTOS | Cada uno los suyos | (los tickets) |
| ✦ NOVEDADES | Verificados | anuncios, actualizaciones, eventos, sorteos, alianzas, boosters |
| ✦ GUÍA DE LA CIUDAD | Verificados | descargas, preguntas, comandos, trabajos, bandas, habilidades, economia, citycoins, vip, socio, emojis |
| ✦ LA CALLE | Verificados | general, off-topic, imagenes, capturas-rp, clips-rp, memes, creadores, directos, sugerencias, resenas, destacados, niveles, cumpleanos, despedidas |
| ✦ FORTUNA E INVITACIONES | Verificados | info-fortuna, fortuna, millonarios, recompensas-invitaciones, invitados |
| ✦ MINIJUEGOS | Verificados | contar, adivina-el-numero, adivina-la-palabra, serpiente-de-palabras, minijuegos |
| ✦ FACCIONES | Verificados | policia, sheriff, fbi, militar, gobierno, citytv, banda |

- Los canales que ya existen se **mueven y renombran** (conservan mensajes, permisos e ID); los de EMPIEZA AQUÍ que
  falten se crean. Los que no están en el plano (staff, logs, voz…) se quedan donde están, y lo que hoy ve todo el
  mundo pasa a verse solo con 👤 USUARIO. Lo que ya estaba oculto (staff, logs) no se toca. Los contadores de
  «Estadísticas» siguen a la vista.
- Mensajes nuevos: **normas** reescritas (6 apartados: trato, publicaciones, cuenta, juego, sanciones con las
  advertencias 1-3, staff), **panel de verificación**, **panel de tickets** y **primeros pasos**. Con
  `limpiar_mensajes` (por defecto sí) se borran antes los mensajes viejos de esos canales.
- Antes de cambiar nada hace una copia con /backup; `/backup restaurar` lo deja como estaba.
- Los embeds del bot pasan al rojo de la marca y el pie «SampCity RolePlay».

## 4. Cómo ponerlo en marcha

1. Subir la web nueva con `DISCORD_CLIENT_ID` y `DISCORD_CLIENT_SECRET` y la redirección
   `https://TU-WEB/auth/discord/callback` en el Developer Portal.
2. Subir el bot con `WEB_URL` (la dirección de la web) en el `.env`. Recomendado empezar con `VERIFICACION=suave`.
3. `/reorganizar vista` para revisar la lista y después `/reorganizar aplicar`.
4. Avisar en anuncios de que hay que verificarse en la web y, pasados unos días, poner `VERIFICACION=on`.
