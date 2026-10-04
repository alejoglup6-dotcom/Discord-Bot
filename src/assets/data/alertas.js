/*
 * Alertas que cada usuario activa o quita en el canal 🔔┆alertas (src/handlers/functions/alertas.js).
 * Cada alerta es un rol "🔔 <nombre>" que el bot crea si falta. Cuando el staff o el bot publican en uno de sus
 * canales (por nombre, sin emojis ni tildes), el bot menciona el rol para avisar a quien la tiene activada.
 * La de TikTok la menciona directamente el aviso de videos nuevos (src/handlers/functions/tiktok.js).
 */
module.exports = [
  { key: "anuncios", emoji: "📰", nombre: "Anuncios", desc: "Novedades importantes del servidor", canales: [/^anuncios$/] },
  { key: "actualizaciones", emoji: "📈", nombre: "Actualizaciones", desc: "Cambios y mejoras del juego", canales: [/^actualizaciones$/] },
  { key: "tiktok", emoji: "🎬", nombre: "TikTok", desc: "Videos nuevos de @sampcity.oficial", canales: [] },
  { key: "eventos", emoji: "🎉", nombre: "Eventos", desc: "Eventos dentro y fuera del juego", canales: [/^eventos$/] },
  { key: "sorteos", emoji: "🎁", nombre: "Sorteos", desc: "Sorteos de VIP, CityCoins y más", canales: [/^sorteos$/] },
  { key: "encuestas", emoji: "📊", nombre: "Encuestas", desc: "Votaciones para decidir el servidor", canales: [/^encuestas$/] },
  { key: "citycoins", emoji: "💎", nombre: "Ofertas", desc: "Ofertas de CityCoins y VIP", canales: [/^citycoins$/, /^vip$/] },
  { key: "fortuna", emoji: "🎰", nombre: "Fortuna", desc: "Premios y novedades de la fortuna", canales: [/^info fortuna$/] },
  { key: "directos", emoji: "📺", nombre: "Directos", desc: "Directos del staff y creadores", canales: [/^directos$/] },
  { key: "postulaciones", emoji: "📋", nombre: "Postulaciones", desc: "Resultados de postulaciones a facciones", canales: [/^resultados postulaciones$/] },
  { key: "alianzas", emoji: "🤝", nombre: "Alianzas", desc: "Nuevas alianzas y colaboraciones", canales: [/^alianzas$/] },
];
