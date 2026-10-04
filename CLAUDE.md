# Bot de Discord (Drok)

## Mantener el repo al día
- Todo cambio se sube al repo: commit y push en la rama de trabajo, y pull request contra `main`.
- Antes de subir: `npm test` contra una copia de la base de datos (las pruebas escriben y borran filas; nunca
  contra la base del servidor en marcha).
- Si se añaden dependencias, se sube también `package-lock.json`.

## Base de datos
- MySQL, la misma base de datos del servidor de SA-MP (repo `alejoglup6-dotcom/Backup`). Nada de MongoDB.
- Los modelos (`src/database/models`) usan `src/database/odm.js`, compatible con mongoose: se escriben igual
  (`new db.Schema(...)`, `db.model(...)`) y cada uno es una tabla `bot_*` que se crea sola.
- `/samp` lee las tablas del gamemode (`player`, `bans`, `bad_history`, `crews`) desde `src/database/samp.js` y
  comparte `discord_*` con `gamemodes/src/discord_link.pwn` del repo Backup. `/whitelist` usa `whitelist` y
  `whitelist_config` (`src/database/whitelist.js`), las mismas que `gamemodes/src/whitelist.pwn`. Si cambia algo de eso, hay que
  actualizar los dos repos.

## Diseño y marca
- Para cualquier diseño (logos, banners, íconos, tienda, anuncios) leer primero `branding/README.md`: gustos del
  dueño (estilo GTA con volumen, nada plano, sin "roleplay", íconos en PNG), colores, tipografías y el historial.
- Los PNG se regeneran con `node branding/scripts/marca.js` (y `branding/scripts/citycoins.js` para la moneda).

## Rangos (juego <-> Discord)
- Lista jerárquica en `src/assets/data/rangos.js`: las MISMAS claves y el mismo orden que `RANGOS` de
  `gamemodes/src/rangos.pwn` (repo Backup). Si se cambia una, cambiar la otra. Tabla y decisiones: `docs/rangos/`.
- `src/handlers/functions/rangosSync.js` sincroniza los roles de las cuentas vinculadas (`RANGOS_SYNC` = off/dry/on);
  reglas en `src/database/rangos.js` (pruebas en `test/rangos.test.js`). Rangos manuales: tabla `player_ranks`.
- Además de los rangos, la sincronización pone y quita: sanciones (🔇 MUTEADO, ⛓️ JAIL OOC, ⚠️ ADVERTENCIA 1-3),
  plataforma y país (tabla `player_status` y `pcharacter.country`), un rol por banda (`discord_crew_roles`) e insignias
  automáticas (`autoBadges`: Donador, Usuario Diamante, Beta tester). También hace la limpieza de `CLEANUP` de
  `src/assets/data/rangos.js` (duplicados, permiso de 🥊 BETA, orden SHERIFF/ALGUACIL). Pruebas con un servidor de
  Discord simulado en `test/rangosSync.test.js`. `/samp advertir` y `/samp quitaradv` = `/adv` y `/quitaradv` del juego.
- Al momento: el gamemode (`DiscordSync_Queue` y `DiscordRankWatch` de `discord_link.pwn`) apunta en `discord_sync_queue` cada
  cuenta que cambia y el bot la sincroniza a los 2 s (`syncPlayers`). Si MySQL lo permite, el bot crea además triggers
  (`rangos.initQueue`) para los cambios hechos fuera del juego. La vuelta completa queda de respaldo.
- Orden de los roles: todos los rangos de `RANKS` arriba en su orden (bandas, SOCIO y VIP tras MIEMBRO DE BANDA), luego 👤 USUARIO
  y debajo el resto (sanciones, años, plataforma, países, avisos). Los roles de bots o con permisos que no son rangos (BETA,
  BOTS) se quedan pegados al rango de encima (`desiredOrder`/`orderNames`/`orderRoles`).

## /juego (comandos del juego para el Fundador)
- `src/assets/data/juego.js` (lista de subcomandos y su acción) y `src/assets/utils/juego.js` (comprobaciones). Solo
  `admin_level` 9 con la cuenta vinculada. Cada uno deja una fila en `discord_actions` y el gamemode la aplica en
  `DiscordAdmin_Apply` (`gamemodes/src/discord_link.pwn`): si se añade o cambia una acción, cambiar los dos repos.
- La contraseña viaja como `salt:hash` (SHA256 como `SHA256_PassHash`), nunca en claro. Pruebas: `test/juego.test.js`.
- El staff lo manda el juego (decidido el 04-oct-2026): `/juego staff` cambia el nivel y la sincronización pone el rol.

## Verificación, tickets y estructura del Discord
- Verificación = cuenta del juego vinculada desde la web (`/verificar` del repo Web, `discord_links`). El bot da 👤 USUARIO
  y pone el apodo del personaje (`src/assets/utils/verification.js`, cada 30 s); `VERIFICACION` = on/suave/off.
- Tickets: `src/assets/utils/ticketsPro.js` (tipos y formularios en `src/assets/data/tickets.js`, datos en `ticketInfo`).
- Estructura del servidor: `src/assets/data/serverLayout.js`, aplicada con `/reorganizar` (`src/assets/utils/serverLayout.js`);
  textos de normas y guía en `src/assets/utils/serverMessages.js`; estilo de mensajes en `src/assets/utils/brand.js`.
  Los nombres conservan las palabras que el bot busca (bienvenida, fortuna, invitados, alianzas...).
- Pruebas con servidor simulado: `test/verificacionTickets.test.js` (`test/helpers/fakeGuild.js`).
