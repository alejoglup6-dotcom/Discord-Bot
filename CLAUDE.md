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
  comparte `discord_*` con `gamemodes/src/discord_link.pwn` del repo Backup. Si cambia algo de eso, hay que
  actualizar los dos repos.
