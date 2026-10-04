# Permisos y comandos (PDF)

`SampCity-permisos-y-comandos.pdf`: qué puede hacer cada rango del staff (0-9) y cada rango de facción, en el juego y
en Discord. Se sube al canal 🗃┆archivos.

Se rehace con los datos del momento (comandos y flags del gamemode, rangos y vehículos de las facciones, permisos de
los roles y de los canales de Discord):

```
curl -H "Authorization: Bot $TOKEN" https://discord.com/api/v10/guilds/<id>/roles    > roles.json
curl -H "Authorization: Bot $TOKEN" https://discord.com/api/v10/guilds/<id>/channels > chans.json
python3 docs/permisos/generar.py <repo Backup> roles.json chans.json docs/permisos/SampCity-permisos-y-comandos.pdf
node docs/permisos/pdf.js docs/permisos/SampCity-permisos-y-comandos.html docs/permisos/SampCity-permisos-y-comandos.pdf
```
(`pdf.js` usa Playwright; `PLAYWRIGHT` y `CHROMIUM` dicen dónde están si no son los de por defecto.)
