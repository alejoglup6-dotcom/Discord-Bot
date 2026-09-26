# Drok

Bot de Discord multipropósito de **Drok**, con más de 400 comandos: moderación, tickets, música, radio, juegos, sorteos, economía, niveles, invitaciones, sugerencias, estadísticas del servidor y mucho más. Todo en español y con comandos de barra.

## Funciones
- Comandos de barra con nombres en español (para clientes de Discord en español)
- discord.js v14
- Automoderación
- Comandos personalizados
- Música con Lavalink v4
- Tickets
- Sugerencias
- Roles por reacción
- Familia
- Sorteos
- Verificación con captcha
- Servidor de SA-MP (`/samp`): vincular la cuenta del juego, perfil, jugadores conectados, tops y sanciones (ban, tempban, unban, mute) para el staff

## Requisitos
- Node.js v22 o superior
- Token del bot: [Portal de desarrolladores de Discord](https://discord.com/developers/applications)
- ID de la aplicación (`DISCORD_ID`) para registrar los comandos de barra
- Base de datos MySQL 8: la misma del servidor de SA-MP (host, usuario, contraseña y nombre de la base de datos de `scriptfiles/srp_db.ini`)
- Opcional: token de Giphy, clave de OpenAI (chatbot), credenciales de Spotify y un nodo propio de Lavalink v4

## Instalación
```bash
git clone https://github.com/alejoglup6-dotcom/Discord-Bot.git
cd Discord-Bot
npm install
```

Copia `.env.example` a `.env`, rellena los datos y arranca el bot:

```bash
npm start
```

## Base de datos
El bot guarda todo en MySQL, en la misma base de datos que el servidor de SA-MP:
- Sus propios datos (niveles, economía, tickets, sorteos...) van en tablas `bot_*` que se crean solas al arrancar.
- `/samp` lee las tablas del gamemode (`player`, `bans`, `bad_history`, `crews`) y usa `discord_links`, `discord_link_codes` y `discord_actions`, que comparte con el gamemode (`gamemodes/src/discord_link.pwn` en el repo Backup).

Si el host de la base de datos solo acepta conexiones del servidor de SA-MP, hay que permitir la IP donde corre el bot (en el panel del hosting, "Remote MySQL" o similar).

Para vincular una cuenta: `/samp link Nombre_Apellido` en Discord y después `/vincular CODIGO` dentro del juego. Las sanciones desde Discord piden la cuenta vinculada y el mismo rango que en el juego (mute: Ayudante, tempban/unban: Operador, ban: Administrador).

### Pasar los datos que había en MongoDB
Solo hace falta si el bot ya tenía datos guardados en MongoDB:
```bash
npm install --no-save mongoose@7
MONGO_TOKEN="mongodb+srv://..." npm run migrate-mongo
```

### Pruebas
`npm test` prueba la capa de datos y los comandos `/samp` contra la base de datos del `.env` (usa una copia, no la del servidor en marcha: las pruebas escriben y borran filas).

## Preguntas frecuentes
> ¿Cómo accedo a los comandos de desarrollador? Añade tu ID de Discord como desarrollador:

```bash
npm run add-dev TU_ID_DE_DISCORD
```

## Licencia
MIT. Consulta el archivo [LICENSE](LICENSE).
