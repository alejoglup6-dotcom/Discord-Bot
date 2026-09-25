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

## Requisitos
- Node.js v22 o superior
- Token del bot: [Portal de desarrolladores de Discord](https://discord.com/developers/applications)
- ID de la aplicación (`DISCORD_ID`) para registrar los comandos de barra
- URL de la base de datos: [MongoDB](https://cloud.mongodb.com)
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

## Preguntas frecuentes
> ¿Cómo accedo a los comandos de desarrollador? Añade tu ID de Discord como desarrollador:

```bash
npm run add-dev TU_ID_DE_DISCORD
```

## Licencia
MIT. Consulta el archivo [LICENSE](LICENSE).
