/*
 * Plano del Discord de SampCity (lo aplica /reorganizar aplicar, src/assets/utils/serverLayout.js).
 *
 * - Cada categoría y canal se busca primero por su nombre nuevo y si no, por "match" (expresión sobre el nombre sin
 *   emojis ni símbolos, ver norm() de guildLookup). Si existe se mueve y se renombra (conserva mensajes, permisos e
 *   ID); si no existe y tiene "create", se crea.
 * - access: "public" = lo ven todos, también los que no se verificaron (solo EMPIEZA AQUÍ);
 *           "verified" = solo los verificados (cuenta del juego vinculada). Los canales que ya estaban ocultos para
 *           @everyone (staff, facciones privadas...) no se tocan.
 * - readOnly: solo el staff escribe.
 * - post: mensaje del bot que se publica en el canal (src/assets/utils/serverMessages.js).
 * Los nombres nuevos conservan las palabras de antes (bienvenida, fortuna, invitados...) porque el bot encuentra
 * varios canales por nombre (guildLookup).
 * Los canales que no están aquí se quedan donde están; las categorías que se queden vacías se borran.
 */
const CATEGORIES = [
  {
    key: "inicio",
    name: "✦ EMPIEZA AQUÍ",
    access: "public",
    channels: [
      { key: "bienvenida", name: "「👋」bienvenidas", match: /^bienvenid/, readOnly: true, topic: "Quién llega a la ciudad." },
      { key: "verificacion", name: "「🔐」verificacion", match: /verifica/, readOnly: true, post: "verify", create: true, topic: "Vincula tu cuenta del juego para ver el resto del Discord." },
      { key: "normas", name: "「📖」normas", match: /^(reglas|normas)( del servidor| generales)?$/, readOnly: true, post: "rules", create: true, topic: "Normas de SampCity, dentro y fuera del juego." },
      { key: "soporte", name: "「🎫」soporte", match: /^(soporte|tickets?|ayuda|abrir ticket)$/, readOnly: true, post: "tickets", create: true, ticketPanel: true, topic: "Abre un ticket y te atiende el staff." },
      { key: "primeros", name: "「🧭」primeros-pasos", match: /guia nuevos|primeros pasos|como empezar|guia/, readOnly: true, post: "guide", create: true, topic: "Cómo empezar a jugar en SampCity." },
    ],
  },
  // la categoría donde se abren los tickets (la de /setup tickets) va justo debajo, para que se vea
  { key: "tickets", name: "✦ TICKETS ABIERTOS", tickets: true },
  {
    key: "novedades",
    name: "✦ NOVEDADES",
    access: "verified",
    channels: [
      { key: "alertas", name: "「🔔」alertas", match: /^alertas$/, readOnly: true },
      { key: "anuncios", name: "「📣」anuncios", match: /^anuncios?$/, readOnly: true },
      { key: "actualizaciones", name: "「🛠️」actualizaciones", match: /actualizacion/, readOnly: true },
      { key: "eventos", name: "「🎉」eventos", match: /^eventos?$/ },
      { key: "sorteos", name: "「🎁」sorteos", match: /^sorteos?$/ },
      { key: "encuestas", name: "「📊」encuestas", match: /^encuestas$/ },
      { key: "postulaciones", name: "「📋」resultados-postulaciones", match: /^resultados postulaciones$/, readOnly: true },
      { key: "alianzas", name: "「🤝」alianzas", match: /alianza/ },
      { key: "boosters", name: "「🚀」boosters", match: /booster/ },
    ],
  },
  {
    key: "guia",
    name: "✦ GUÍA DE LA CIUDAD",
    access: "verified",
    channels: [
      { key: "descargas", name: "「📲」descargas", match: /descarga/, readOnly: true },
      { key: "faq", name: "「❓」preguntas", match: /^(faq|preguntas( frecuentes)?)$/, readOnly: true },
      { key: "comandos", name: "「⌨️」comandos", match: /^comandos$/, readOnly: true },
      { key: "trabajos", name: "「👷」trabajos", match: /^trabajos$/, readOnly: true },
      { key: "bandas", name: "「☠️」bandas", match: /^bandas$/, readOnly: true },
      { key: "habilidades", name: "「🏆」habilidades", match: /habilidad/, readOnly: true },
      { key: "economia", name: "「📊」economia", match: /^economia$/, readOnly: true },
      { key: "citycoins", name: "「💎」citycoins", match: /citycoin/, readOnly: true },
      { key: "vip", name: "「👑」vip", match: /^vip$/, readOnly: true },
      { key: "socio", name: "「🥇」socio", match: /^socio$/, readOnly: true },
      { key: "emojis", name: "「🐱」emojis", match: /^emojis$/, readOnly: true },
    ],
  },
  {
    key: "comunidad",
    name: "✦ LA CALLE",
    access: "verified",
    channels: [
      { key: "general", name: "「💬」general", match: /^(general|chat|chat general|charla)$/ },
      { key: "offtopic", name: "「🍹」off-topic", match: /off ?topic/ },
      { key: "imagenes", name: "「📷」imagenes", match: /^imagenes$/ },
      { key: "capturas", name: "「📸」capturas-rp", match: /captura/ },
      { key: "clips", name: "「🎬」clips-rp", match: /clip/ },
      { key: "memes", name: "「😂」memes", match: /^memes?$/ },
      { key: "creadores", name: "「🎥」creadores", match: /creadores|youtubers?/ },
      { key: "directos", name: "「📺」directos", match: /directos?/ },
      { key: "tiktok", name: "「🎵」tiktok", match: /^tiktok$/ },
      { key: "sugerencias", name: "「💡」sugerencias", match: /sugerencia/ },
      { key: "resenas", name: "「📝」resenas", match: /resena/ },
      { key: "destacados", name: "「⭐」destacados", match: /destacado/ },
      { key: "niveles", name: "「🆙」niveles", match: /^niveles$/ },
      { key: "cumples", name: "「🎂」cumpleanos", match: /cumple/ },
      { key: "despedidas", name: "「👋」despedidas", match: /despedid/ },
    ],
  },
  {
    key: "fortuna",
    name: "✦ FORTUNA Y RANKINGS",
    access: "verified",
    channels: [
      { key: "infofortuna", name: "「💰」info-fortuna", match: /info fortuna/, readOnly: true },
      { key: "fortuna", name: "「🎰」fortuna", match: /^fortuna$/ },
      { key: "millonarios", name: "「💼」millonarios", match: /millonario/, readOnly: true },
      { key: "ranking", name: "「🏅」ranking-semanal", match: /^ranking semanal$/, readOnly: true },
      { key: "logros", name: "「🥇」logros", match: /^logros$/, readOnly: true },
      { key: "recompensas", name: "「🎁」recompensas-invitaciones", match: /recompensas invitaciones/, readOnly: true },
      { key: "invitados", name: "「🔔」invitados", match: /^invitados$/, readOnly: true },
    ],
  },
  {
    key: "juegos",
    name: "✦ MINIJUEGOS",
    access: "verified",
    channels: [
      { key: "contar", name: "「🔢」contar", match: /^contar$/ },
      { key: "numero", name: "「🎯」adivina-el-numero", match: /adivina el numero/ },
      { key: "palabra", name: "「🔤」adivina-la-palabra", match: /adivina la palabra/ },
      { key: "serpiente", name: "「🐍」serpiente-de-palabras", match: /serpiente/ },
      { key: "minijuegos", name: "「🎲」minijuegos", match: /^minijuegos$/ },
    ],
  },
  {
    key: "facciones",
    name: "✦ FACCIONES",
    access: "verified",
    channels: [
      { key: "policia", name: "「👮」policia", match: /^(policia|lspd|sapd)$/ },
      { key: "sheriff", name: "「🎖️」sheriff", match: /^(sheriff|lssd)$/ },
      { key: "fbi", name: "「🕵️」fbi", match: /^fbi$/ },
      { key: "militar", name: "「🪖」militar", match: /^(militar|milicia|saem)$/ },
      { key: "gobierno", name: "「🏛️」gobierno", match: /^(gobierno|gob)$/ },
      { key: "citytv", name: "「📺」citytv", match: /^(citytv|satv)$/ },
      { key: "banda", name: "「💀」banda", match: /^banda$/ },
    ],
  },
];

// Categorías que nunca se ocultan ni se borran (contadores de miembros)
const KEEP_VISIBLE = /estadistica/;

module.exports = { CATEGORIES, KEEP_VISIBLE };
