const Discord = require("discord.js");

const NORMATIVAS_COLOR = "#2ECC71";
const ROLEAR_COLOR = "#F1C40F";
const BOOST_COLOR = "#FF6EC7";

/**
 * Embeds reales (contenido de la plantilla, moneda ya renombrada a CityCoins).
 * Cada clave es el nombre del canal al que corresponden esos embeds.
 */
const TICKET_ROW = new Discord.ActionRowBuilder().addComponents(
  new Discord.ButtonBuilder()
    .setCustomId("Bot_openticket")
    .setEmoji("🎫")
    .setLabel("Abrir ticket")
    .setStyle(Discord.ButtonStyle.Success),
);

const CONTENT = {
  reglas: [
    {
      title: `🔖・Reglamento General SampCity RolePlay Android 📱 | 💻 PC`,
      color: NORMATIVAS_COLOR,
      footer: `📚 Reglamento General Comunidad SampCity`,
      desc: `⚖️ Las reglas están para mantener un control y un buen ambiente dentro y fuera de la comunidad.
🗄️ Nos reservamos el derecho de sancionar cualquier cuenta sin motivo previo.

**REGLAS COMUNIDAD**

🟥 **SPAM** — Hacer publicidad sin permiso de cualquier tipo tanto por chat como por privado. Sanción: Baneo permanente (sin apelación).
🟥 **FRAUDE** — El engaño, la estafa, el abuso y la falsedad fuera de rol se considerarán fraude. Sanción: Baneo permanente (sin apelación).
🟥 **TOXICIDAD** — Comportamiento desagradable hacia la comunidad o los demás. Sanción: Baneo permanente (sin apelación).
🟧 **FLOOD** — Enviar el mismo mensaje varias veces seguidas. Sanción: Expulsión.
🟦 **PEDIR RANGO** — Molestar constantemente al staff para entrar en la administración. Sanción: Muteo.
🟦 **MENCIONAR** — Mencionar a otras personas sin motivo o solo para molestar. Sanción: Muteo.
🟥 **CONTENIDO +18** — Todo contenido NSFW está prohibido en cualquier canal. Sanción: Baneo permanente.
🟦 **OFENDER A LOS DEMÁS** — Toda ofensa con el único objetivo de causar daño. Sanción: Muteo.
🟥 **PRIVACIDAD** — Compartir datos personales (información, contraseñas, fotos, cuentas…). Sanción: Baneo permanente.

📕 Toda regla incumplida puede tener, según las circunstancias, 🟥 Baneo permanente.`,
    },
  ],
  normativas: [
    {
      title: `🗺️・Normativas de Rol SampCity RolePlay Android 📱 | 💻 PC`,
      color: NORMATIVAS_COLOR,
      footer: `📚 Normativas RolePlay Servidor SampCity`,
      desc: `⚖️ Las normativas de rol están para mantener un control y un buen ambiente dentro del servidor de SampCity.
🗄️ La moderación tomará las medidas necesarias para sancionar en caso de incumplirlas.
✅ Al formar parte de esta comunidad aceptás cumplir con todas y cada una de nuestras normativas.

**CONCEPTOS**

👊 **DM** (DeathMatch) — Atacar sin razón.
🗣️ **MG** (MetalGaming) — Uso inadecuado de información OOC en IC (o viceversa).
🕺 **PG** (PowerGaming) — Forzar acciones o el entorno.
😵 **PK** (PlayerKill) — Pérdida de memoria tras reaparecer en el hospital.
🛑 **BD** (BadDriving) — Conducción inadecuada.
🚗 **CK** (CarKill) — Asesinar atropellando.
🆕 **NA** (NoobAbuse) — Abusar de un usuario nuevo.
🔩 **BA** (BugAbuse) — Abusar de un error del servidor.
🙌 **NRE** (No Rolear Entorno) — Realizar acciones sin describir tu alrededor.

⬜ Tipo de sanción: ADVERTENCIA o JAIL OOC.
🌀 Las normativas pueden actualizarse en cualquier momento sin aviso previo.
📕 La acumulación de sanciones puede terminar en 🟥 Baneo permanente.
📖 No conocer las normativas no justifica su incumplimiento.`,
    },
    {
      title: `⚙️・Normativas sobre MODs SampCity RolePlay Android 📱 | 💻 PC`,
      color: NORMATIVAS_COLOR,
      desc: `**MODS**

💿 **CHEATS** — Cualquier mod usado con la finalidad de obtener ventajas.
🖱️ **AIMBOT** — Todo tipo de auto apuntado.

🟥 Tipo de sanción: Baneo permanente (sin apelación alguna).

Notas finales:
💢 La sanción puede darse sin previo aviso.
🕘 La sanción puede darse en cualquier momento.
🗑️ La cuenta será eliminada después de un periodo de tiempo.`,
    },
    {
      title: `⌨️・Normativas sobre CMDs SampCity RolePlay Android 📱 | 💻 PC`,
      color: NORMATIVAS_COLOR,
      desc: `**OOC — Información fuera del personaje**
\`/Reportar [ID] [RAZÓN]\` — Reportar a quien incumpla las normativas. Ej: /reportar 0 DM
\`/Duda [Mensaje]\` — Enviar una duda sobre el servidor. Ej: /duda ¿Como veo todos los comandos?
\`/b [Mensaje]\` — Hablarle a un usuario fuera del personaje. Ej: /b Hola admin

**IC — Información del personaje**
\`/me [Acción]\` — Rolear las acciones de tu personaje. Ej: /me saca una pistola de su cinturon.
\`/do [Entorno]\` — Rolear el entorno a tu alrededor. Ej: /do pasarían peatones.
\`/g [Grito]\` — Realizar un grito. Ej: /g Aparta
\`/s [Susurro]\` — Realizar un susurro. Ej: /s a cuanto el gramo.
\`/t [twitter]\` — Usar twitter. Ej: /t abro hilo.

**Sanciones por mal uso**
🟦 **MUR** (Mal Usar Reportes) — Uso inadecuado de /reportar.
🟦 **MUD** (Mal Usar Dudas) — Uso inadecuado de /duda.
🟦 **MUT** (Mal Usar Twitter) — Uso inadecuado de /twitter.
🟥 **MUC** (Mal Usar Comando) — Uso inadecuado de /me o /do. Baneo temporal.`,
    },
    {
      title: `🗺️・Normativas sobre Zonas SampCity RolePlay Android 📱 | 💻 PC`,
      color: NORMATIVAS_COLOR,
      desc: `**ZONAS**

🟩 **ZS — Zona Segura** — Todas las zonas públicas. Prohibido realizar cualquier acción ilegal. Sin riesgo.
🟦 **ZL — Zona Libre** — Zona de conquista sin color. Obligatorio llamar a la policía si hay una acción ilegal. Riesgo bajo.
🟥 **ZC — Zona de Combate** — Zona de conquista en combate. Permitido realizar cualquier acción ilegal. Riesgo extremo.
🟧 **ZB — Zona de Banda** — Zona de conquista con color. Permitido realizar cualquier acción ilegal por la banda dominante. Riesgo alto.

👷 Los usuarios en estado de trabajo solo pueden ser atacados en la ZC.
⬜ Tipo de sanción: ADVERTENCIA o JAIL OOC.`,
    },
    {
      title: `📓・Bandas SampCity RolePlay Android 📱 | 💻 PC`,
      color: NORMATIVAS_COLOR,
      footer: `👥 Reglamento Bandas Servidor SampCity`,
      desc: `📖 Las bandas tienen la obligación de cumplir las reglas y normativas de SampCity.
Es importante que el líder de una banda tome las decisiones adecuadas y que todos los miembros respeten las normativas.
📛 Aplicaremos sanciones a los integrantes de una banda utilizando estos términos:

☠️ **Liderazgo** — El líder es responsable del incumplimiento de las normativas por parte de sus miembros y deberá responder por las acciones de su banda, con una sanción según la gravedad.
👤 **Miembro** — Al miembro solo se le aplica directamente la sanción correspondiente a su infracción.

🗑️ Nos reservamos el derecho de eliminar cualquier banda en cualquier momento.`,
    },
  ],
  rolear: [
    {
      title: `🎭・Reglamento de Rol SampCity RolePlay Android 📱 | 💻 PC`,
      color: ROLEAR_COLOR,
      footer: `📚 Reglamento RolePlay Comunidad SampCity`,
      desc: `1️⃣ **Interpretación del Personaje** 🎭

Tu personaje no eres vos. Es una persona ficticia con:
- Nombre
- Historia
- Personalidad
- Miedos y metas

Pensá en tu personaje como un actor en una película improvisada: vos no decidís todo, sino que actuás según quién es tu personaje y lo que ocurre a tu alrededor.

🧩 Antes de actuar, preguntate: ¿Qué haría mi personaje en esta situación?
- Si tu personaje es tranquilo, no va a reaccionar con violencia por cualquier cosa.
- Si es policía, debe actuar según la ley.

💡 **Consejos:** Mantené coherencia con su personalidad · No hagas cosas solo para ganar · No seas experto en todo.

🗣️ **Hablar como tu personaje (IC)** — Simplemente escribí en el chat normal.
📢 **Hablar fuera del personaje (OOC)** — Usá \`/b [texto]\`. Ej: \`/b Perdón, soy nuevo en el servidor.\`

‼️ No mezcles OOC con IC.
❌ No hagas esto: "Hola admin esto es un bug." · "Eso es fail rol, no podés hacer eso." · "Es PG, no podés chocarme así."`,
    },
    {
      color: ROLEAR_COLOR,
      desc: `2️⃣ **Interpretación del Entorno** 🧐

- El entorno es todo lo que te rodea: ciudad, personas, leyes y consecuencias.
- Debés actuar como si todo fuera real.

⌨️ Comando: \`/do [texto]\`

📚 Ejemplos: No conduzcas por la vereda como si nada · No ignores un choque fuerte · No actúes como si los disparos no existieran.

📝 También podés usar /do para aclarar el entorno: \`/do ¿Hay mucha gente mirando?\`

❗ El entorno no es solo un mapa. Es un lugar donde tu personaje vive.
‼️ El /do NO es para acciones ni para vender: es para describir o preguntar cosas del entorno.`,
    },
    {
      color: ROLEAR_COLOR,
      desc: `3️⃣ **Interpretación de la Acción** 🎬

- Cada acción tiene una consecuencia.
- No podés decidir todo vos solo.

⌨️ Comando: \`/me [texto]\` · \`/intentar [texto]\`

❌ Mal ejemplo: \`/me lo golpea y lo deja inconsciente.\`
✅ Buen ejemplo: \`/me intenta golpearlo en el rostro.\` seguido de \`/do ¿Logro acertar?\`

Siempre dale oportunidad al otro jugador de responder.

💡 Recordá: tu personaje siente dolor, puede fallar, puede asustarse, no es invencible.

📘 **Regla general**
Si algo no sería lógico en la vida real, probablemente no sea buen rol. El objetivo no es ganar: es crear una historia creíble junto a los demás.`,
    },
  ],
  soporte: [
    {
      title: `🔎・Soporte SampCity RolePlay Android 📱 | 💻 PC`,
      footer: `👨‍💻 Equipo de Soporte Administración SampCity`,
      components: [TICKET_ROW],
      desc: `🔎 Abrí un ticket con el tema que corresponda:

ℹ️ Dudas — Necesitás resolver tus dudas.
📁 Reportar usuario — Reporta a un usuario que incumplió las #reglas o #normativas.
📋 Reportar staff — Reporta a un staff que no está haciendo lo correcto.
🔩 Reportar Bug — Reporta errores de SampCity.
📺 Creador de Contenido — Reclamá tu recompensa como creador de contenido.
💾 Recuperar Cuenta — Recuperá tu cuenta por correo.
📛 Apelar Ban — ¿Baneado injustamente o pedís una segunda oportunidad?
🆘 Soporte global — Tenés un problema y necesitás ayuda.
🏆 Compra Exclusiva — Comprar accesorios, vehículos, skins, armas VIP.
💎 Comprar CityCoins — Necesitás realizar una compra de 🪙 CityCoins.

💳 Métodos de pago (CityCoins): PayPal, VISA/Mastercard, PaySafeCard, y métodos locales según el país.`,
    },
  ],
  boost: [
    {
      title: `🔮・BOOST Discord SampCity RolePlay Android 📱 | 💻 PC`,
      color: BOOST_COLOR,
      footer: `🔮 BOOSTER Discord SampCity`,
      desc: `🔮 ——🥽 CITYCOINS ◇ BOOSTER 🥽——

Ventajas:
🗿 Modificar tu signo con !signo.
🚦 Modificar tu color con !color.
💰 Recibís +100.000 💵 en #fortuna.
👷 Conseguís X2 en !trabajar.

🐙 Las ventajas pueden cambiar en cualquier momento.
ℹ️ Las ventajas se obtienen de forma automática.

🌐 BOOSTEA EL SERVIDOR DE 🔮 DISCORD PARA OBTENER ⚜️ VENTAJAS ÚNICAS`,
    },
  ],
};

const TOPICS = {
  reglas: "📖 Reglamento general de la comunidad SampCity RolePlay. Léelo antes de participar.",
  normativas: "📚 Normativas de rol: conceptos (DM, MG, PG…), MODs, comandos IC/OOC, zonas y bandas.",
  rolear: "🎭 Cómo interpretar a tu personaje, el entorno y las acciones. Leé esto antes de rolear.",
  soporte: "🔎 Dudas, reportes, recuperar cuenta, apelar ban y compras. Abrí un ticket según tu caso.",
  boost: "🔮 Ventajas de boostear el servidor de Discord de SampCity.",
};

// Contenido extra para canales nuevos. Los {{...}} son marcadores que debes
// reemplazar por tus datos reales (igual que en la plantilla original).
CONTENT["guia-nuevos"] = [
  {
    title: "🚀・Guía para nuevos jugadores SampCity RolePlay Android 📱 | 💻 PC",
    color: NORMATIVAS_COLOR,
    footer: "📚 Guía de inicio Comunidad SampCity",
    desc: "Sigue estos pasos para entrar a jugar:\n\n1️⃣ Lee <#reglas> y <#normativas>.\n2️⃣ Verifícate en el canal de verificación para desbloquear el servidor.\n3️⃣ Elige tus roles (país, plataforma y avisos) en <#autoroles>.\n4️⃣ Descarga el cliente desde <#descargas>.\n5️⃣ Conéctate con la IP `{{IP}}` y el puerto `{{PUERTO}}`.\n6️⃣ Crea tu personaje y lee <#rolear> antes de empezar a rolear.\n\n🔎 ¿Dudas? Abre un ticket en <#soporte>.",
  },
];

Object.assign(TOPICS, {
  // Inicio
  verificacion: "✅ Pulsa el botón y resuelve el captcha para desbloquear el resto del servidor.",
  bienvenidas: "🎍 Bienvenidas automáticas a los nuevos miembros.",
  despedidas: "👋 Miembros que salieron de la comunidad.",
  anuncios: "📰 Anuncios oficiales de SampCity.",
  actualizaciones: "📈 Registro de cambios y actualizaciones del servidor de juego.",
  autoroles: "🎭 Elige tu país, tu plataforma y los avisos que quieres recibir.",
  // Información
  faq: "❓ Preguntas frecuentes sobre el servidor.",
  comandos: "⌨️ Lista de comandos del servidor de juego.",
  "guia-nuevos": "🚀 Pasos para entrar a jugar por primera vez.",
  alianzas: "🤝 Comunidades aliadas de SampCity.",
  // Facciones
  "resultados-postulaciones": "📋 Resultados de las postulaciones a facciones y bandas.",
  comunicado: "📢 Comunicados oficiales de esta facción.",
  // General
  "comandos-bot": "🤖 Usa aquí los comandos del bot para no ensuciar los demás chats.",
  cumpleaños: "🎂 Cumpleaños de la comunidad.",
  sugerencias: "🗳️ Sugerencias para el servidor. Usa el comando del bot para enviarlas.",
  "capturas-rp": "📸 Comparte tus mejores capturas de rol.",
  "clips-rp": "🎬 Clips y momentos de rol.",
  arte: "🎨 Arte, diseños, skins y creaciones de la comunidad.",
  "nuevos-boosters": "🚀 Agradecimientos a quienes boostean el servidor.",
  // Eventos
  eventos: "🎉 Eventos de la comunidad y del servidor de juego.",
  sorteos: "🎁 Sorteos activos.",
  encuestas: "📊 Encuestas de la comunidad.",
  ganadores: "🏆 Ganadores de eventos y sorteos.",
  "eventos-chat": "💬 Charla sobre los eventos.",
  // Minijuegos
  casino: "🎰 Casino del bot: blackjack, ruleta, slots y crash.",
  juegos: "🎲 Juegos y minijuegos del bot.",
  familia: "💞 Comandos de familia: casarse, adoptar, etc.",
  niveles: "🆙 Avisos de subida de nivel.",
  ranking: "📈 Clasificaciones de economía y niveles.",
  // Soporte
  "jail-ooc": "⛓️ Canal para usuarios con sanción de Jail OOC.",
  // Staff
  "staff-anuncios": "📢 Anuncios internos para el staff.",
  "staff-chat": "💬 Chat general del staff.",
  "reglamento-staff": "📜 Reglamento y guías internas del staff.",
  "tareas-staff": "📝 Tareas y pendientes del staff.",
  evidencias: "🧾 Evidencias de sanciones (capturas y clips).",
  "apelaciones-ban": "🔨 Revisión de apelaciones de baneo.",
  "votaciones-staff": "🗳️ Votaciones internas del staff.",
  "soporte-staff": "🎫 Coordinación de tickets y soporte.",
  "comandos-staff": "🤖 Comandos del bot y del servidor para el staff.",
  "comandos-admin": "🕹 Comandos de administración del servidor de juego.",
  // Dirección
  direccion: "👑 Canal de la dirección.",
  "gestion-staff": "🧾 Ascensos, bajas y evaluación del staff.",
  "reportes-direccion": "📊 Reportes hacia la dirección.",
  configuracion: "⚙️ Configuración del servidor, del bot y del gamemode.",
  "registro-decisiones": "🗄️ Registro de decisiones importantes.",
  // Logs
  "server-logs": "📜 Logs generales del servidor (los usa el bot).",
  "log-entradas-salidas": "📥 Entradas y salidas de miembros.",
  "log-mensajes": "💬 Mensajes editados y borrados.",
  "log-moderacion": "🔨 Acciones de moderación.",
  "log-tickets": "🎫 Registro de tickets (lo usa el bot).",
  "log-servidor-samp": "🖥 Logs del servidor de juego.",
  "log-economia": "💰 Movimientos de economía del servidor de juego.",
  "log-admin-ingame": "🔐 Acciones de admins dentro del juego.",
  "setup-sampcity": "📃 Registro de la creación de la plantilla.",
  // Desarrollo
  "dev-chat": "💻 Chat de desarrollo.",
  "bugs-reportados": "🐛 Bugs reportados pendientes de revisar.",
  mapeo: "🗺️ Mapeo y objetos del servidor.",
  "servidor-de-pruebas": "🧪 Pruebas antes de subir cambios al servidor principal.",
  "cambios-y-commits": "📎 Cambios y commits del gamemode.",
  // Líderes
  "lideres-bandas": "🏴‍☠️ Canal privado de líderes de bandas.",
  "mando-legal": "🎖 Canal privado del mando de las facciones legales.",
});

// ─────────────────────────────────────────────────────────────────────────────
//  PERMISOS
// ─────────────────────────────────────────────────────────────────────────────
const P = Discord.PermissionsBitField.Flags;

const PERMS = {
  admin: [P.Administrator],
  high: [
    P.ManageChannels, P.ManageRoles, P.ManageMessages, P.KickMembers,
    P.BanMembers, P.ModerateMembers, P.ManageNicknames, P.ViewAuditLog,
    P.MentionEveryone, P.ManageThreads, P.MoveMembers, P.MuteMembers,
    P.DeafenMembers, P.ManageEvents, P.ManageWebhooks, P.PrioritySpeaker,
    P.CreateInstantInvite,
  ],
  mod: [
    P.ManageMessages, P.KickMembers, P.BanMembers, P.ModerateMembers,
    P.ManageNicknames, P.ViewAuditLog, P.ManageThreads, P.MoveMembers,
    P.MuteMembers, P.DeafenMembers, P.PrioritySpeaker,
  ],
  modJr: [
    P.ManageMessages, P.KickMembers, P.ModerateMembers, P.ManageNicknames,
    P.ManageThreads, P.MoveMembers, P.MuteMembers, P.PrioritySpeaker,
  ],
  helper: [P.ManageMessages, P.ModerateMembers, P.MuteMembers, P.PrioritySpeaker],
  support: [P.ManageMessages, P.ManageThreads],
  events: [P.ManageEvents, P.MoveMembers, P.MuteMembers, P.PrioritySpeaker],
};

// Permisos base de @everyone (sin mencionar @everyone ni crear invitaciones).
const EVERYONE_PERMS = [
  P.ViewChannel, P.SendMessages, P.SendMessagesInThreads, P.ReadMessageHistory,
  P.AddReactions, P.EmbedLinks, P.AttachFiles, P.UseExternalEmojis,
  P.UseApplicationCommands, P.ChangeNickname, P.Connect, P.Speak, P.UseVAD,
];

// ─────────────────────────────────────────────────────────────────────────────
//  ROLES (de mayor a menor jerarquía: el primero queda arriba)
// ─────────────────────────────────────────────────────────────────────────────
const r = (key, name, color, opts = {}) => ({ key, name, color, ...opts });

const PROGRESION = [
  ["α", "ARENA", "🌴"], ["β", "BARRO", "🗻"], ["γ", "TIERRA", "🌍"],
  ["δ", "TERREMOTO", "🌀"], ["ε", "PIEDRA", "🌕"], ["ζ", "ROCA", "🗿"],
  ["η", "HIERRO", "⚔️"], ["θ", "PLATA", "♦️"], ["ξ", "PLANTA", "🌱"],
  ["ρ", "ARBOL", "🌻"], ["φ", "FURIA", "💥"], ["Φ", "TSUNAMI", "🌊"],
  ["λ", "RELAMPAGO", "⚡"], ["Γ", "CASHE", "🐙"],
];
const PROGRESION_COLORS = [
  "#F4D03F", "#A0785A", "#7D6608", "#AF7AC5", "#95A5A6", "#7F8C8D", "#5D6D7E",
  "#BDC3C7", "#58D68D", "#F5B041", "#EC7063", "#3498DB", "#F7DC6F", "#E91E63",
];

const PAISES = [
  ["ar", "🇦🇷", "Argentina"], ["bo", "🇧🇴", "Bolivia"], ["br", "🇧🇷", "Brasil"],
  ["cl", "🇨🇱", "Chile"], ["co", "🇨🇴", "Colombia"], ["cr", "🇨🇷", "Costa Rica"],
  ["cu", "🇨🇺", "Cuba"], ["ec", "🇪🇨", "Ecuador"], ["sv", "🇸🇻", "El Salvador"],
  ["gt", "🇬🇹", "Guatemala"], ["ht", "🇭🇹", "Haití"], ["hn", "🇭🇳", "Honduras"],
  ["mx", "🇲🇽", "México"], ["ni", "🇳🇮", "Nicaragua"], ["pa", "🇵🇦", "Panamá"],
  ["py", "🇵🇾", "Paraguay"], ["pe", "🇵🇪", "Perú"], ["pr", "🇵🇷", "Puerto Rico"],
  ["do", "🇩🇴", "República Dominicana"], ["uy", "🇺🇾", "Uruguay"],
  ["ve", "🇻🇪", "Venezuela"], ["es", "🇪🇸", "España"], ["us", "🇺🇸", "Estados Unidos"],
  ["otro", "🌍", "Otro país"],
];

const ROLE_DEFS = [
  // ── Dirección ──
  r("fundador", "🔱 FUNDADOR", "#F1C40F", { hoist: true, perms: PERMS.admin }),
  r("cofundador", "⚜️ CO-FUNDADOR", "#E67E22", { hoist: true, perms: PERMS.admin }),

  // ── Staff ──
  r("encargado", "⭕ ENCARGADO STAFF", "#E74C3C", { hoist: true, perms: PERMS.high }),
  r("admin", "🛡️ ADMINISTRADOR", "#C0392B", { hoist: true, perms: PERMS.high }),
  r("modglobal", "👨‍💻 MODERADOR GLOBAL", "#9B59B6", { hoist: true, perms: PERMS.mod }),
  r("mod", "🧑‍💻 MODERADOR", "#8E44AD", { hoist: true, perms: PERMS.modJr }),
  r("ayudante", "🙋 AYUDANTE", "#3498DB", { hoist: true, perms: PERMS.helper }),
  r("soporte", "🎫 SOPORTE", "#1ABC9C", { hoist: true, perms: PERMS.support }),
  r("evaluador", "📝 EVALUADOR DE FACCIONES", "#16A085", { hoist: true }),
  r("staffrpg", "🎮 STAFF RPG", "#2ECC71", { hoist: true }),
  r("staffcv", "🎙️ STAFF CV", "#27AE60", { hoist: true }),
  r("organizador", "🎪 ORGANIZADOR DE EVENTOS", "#F39C12", { hoist: true, perms: PERMS.events }),

  // ── Desarrollo ──
  r("dev", "💻 SCRIPTER", "#00BCD4", { hoist: true }),
  r("mapper", "🗺️ MAPPER", "#26C6DA", { hoist: true }),
  r("bots", "🤖 BOTS", "#95A5A6", { hoist: true }),

  // ── Facciones (mando y rol base) ──
  r("alguacil", "🎖 ALGUACIL", "#F1C40F", { hoist: true }),
  r("sheriff", "🎖 SHERIFF", "#C5B358", { hoist: true }),
  r("comisario", "👮 COMISARIO", "#3498DB", { hoist: true }),
  r("policia", "👮 POLICIA", "#E74C3C", { hoist: true }),
  r("director", "🕵 DIRECTOR", "#2C2F33", { hoist: true }),
  r("fbi", "🕵 FBI", "#95A5A6", { hoist: true }),
  r("general", "🪖 GENERAL", "#2ECC71", { hoist: true }),
  r("militar", "🪖 MILITAR", "#A0522D", { hoist: true }),
  r("gobernador", "🏛️ GOBERNADOR", "#607D8B", { hoist: true }),
  r("gobierno", "💼 GOBIERNO", "#78909C", { hoist: true }),
  r("directorsatv", "🎬 DIRECTOR SATV", "#C2185B", { hoist: true }),
  r("satv", "📺 SATV", "#E91E63", { hoist: true }),
  r("lider", "🏴‍☠️ LIDER", "#992D22", { hoist: true }),
  r("banda", "💀 MIEMBRO DE BANDA", "#6C7A89"),

  // ── Comunidad / especiales ──
  r("youtuber", "🔴 YOUTUBER", "#E74C3C", { hoist: true }),
  r("tiktoker", "🟣 TIKTOKER", "#9B59B6", { hoist: true }),
  r("streamer", "🎥 STREAMER", "#A970FF", { hoist: true }),
  r("socio", "🥇 SOCIO", "#E67E22", { hoist: true }),
  r("vip", "👑 VIP", "#F1C40F", { hoist: true }),
  r("diamante", "💎 USUARIO DIAMANTE", "#5DADE2", { hoist: true }),
  r("empresario", "💰 EMPRESARIO", "#F5B041", { hoist: true }),
  r("millonario", "💵 MILLONARIO", "#1E8449", { hoist: true }),
  r("booster", "🎉 CityBooster", "#FF6EC7", { hoist: true }),
  r("destacado", "🌟 MIEMBRO DESTACADO", "#FDCB6E"),
  r("campeon", "🏆 CAMPEÓN DE EVENTOS", "#FFD700"),
  r("artista", "🎨 ARTISTA", "#FD79A8"),
  r("donador", "💸 DONADOR", "#55EFC4"),
  r("bughunter", "🐛 BUG HUNTER", "#6AB04C"),
  r("usuario", "👤 USUARIO", "#2ECC71", { hoist: true }),

  // ── Sanciones ──
  r("muteado", "🔇 MUTEADO", "#7F8C8D"),
  r("jail", "⛓️ JAIL OOC", "#636E72"),
  r("warn1", "⚠️ ADVERTENCIA 1", "#F9E79F"),
  r("warn2", "⚠️ ADVERTENCIA 2", "#F5B041"),
  r("warn3", "⚠️ ADVERTENCIA 3", "#E74C3C"),

  // ── Progresión de usuarios ──
  ...PROGRESION.map(([letra, nombre, emoji], i) =>
    r(`prog${i}`, `${emoji}·USUARIO ${letra} ${nombre}`, PROGRESION_COLORS[i]),
  ),

  // ── Año de ingreso ──
  r("y2021", "2021", "#E64A19"),
  r("y2022", "2022", "#D2691E"),
  r("y2023", "2023", "#3498DB"),
  r("y2024", "2024", "#9B59B6"),
  r("y2025", "2025", "#2ECC71"),
  r("y2026", "2026", "#F1C40F"),
  r("decor1", "🎈", "#FFFFFF"),
  r("decor2", "🎵", "#FFFFFF"),

  // ── Autoroles: avisos y plataforma ──
  r("n_anuncios", "📢 Avisos: Anuncios", "#5865F2", { mentionable: true, self: "intereses", emoji: "📢", label: "Avisos: Anuncios" }),
  r("n_eventos", "🎉 Avisos: Eventos", "#5865F2", { mentionable: true, self: "intereses", emoji: "🎉", label: "Avisos: Eventos" }),
  r("n_sorteos", "🎁 Avisos: Sorteos", "#5865F2", { mentionable: true, self: "intereses", emoji: "🎁", label: "Avisos: Sorteos" }),
  r("n_encuestas", "📊 Avisos: Encuestas", "#5865F2", { mentionable: true, self: "intereses", emoji: "📊", label: "Avisos: Encuestas" }),
  r("n_updates", "🔄 Avisos: Actualizaciones", "#5865F2", { mentionable: true, self: "intereses", emoji: "🔄", label: "Avisos: Actualizaciones" }),
  r("p_android", "📱 ANDROID", "#3DDC84", { self: "intereses", emoji: "📱", label: "Juego en Android" }),
  r("p_pc", "💻 PC", "#0078D4", { self: "intereses", emoji: "💻", label: "Juego en PC" }),

  // ── Autoroles: países ──
  ...PAISES.map(([code, emoji, nombre]) =>
    r(`pais_${code}`, `${emoji} ${nombre}`, null, { self: "paises", emoji, label: nombre }),
  ),
];

// ─────────────────────────────────────────────────────────────────────────────
//  GRUPOS DE ROLES PARA PERMISOS DE CANALES
// ─────────────────────────────────────────────────────────────────────────────
const STAFF_TOP = ["fundador", "cofundador", "encargado", "admin"];
const STAFF_MOD = [...STAFF_TOP, "modglobal", "mod", "ayudante"];
const STAFF_ALL = [...STAFF_MOD, "soporte", "evaluador", "staffrpg", "staffcv", "organizador"];
const DEV = ["dev", "mapper"];
const MANDOS = ["alguacil", "comisario", "director", "general", "gobernador", "directorsatv"];

// ─────────────────────────────────────────────────────────────────────────────
//  ESTRUCTURA DE CANALES
//
//  view:  "everyone" (todos) | "members" (solo verificados) | [claves de rol]
//  write: "all" (todos) | "none" (solo dirección) | [claves de rol que pueden escribir]
//  Un canal hereda view/write de su categoría si no define los suyos.
// ─────────────────────────────────────────────────────────────────────────────
const FACTIONS = [
  { cat: "💼 GOB", com: "💼📢┆comunicado", chat: "💬┆chat-gob", voz: "🎙┆Sala GOB", base: "gobierno", mando: "gobernador" },
  { cat: "📺 SATV", com: "📺📢┆comunicado", chat: "💬┆chat-satv", voz: "🎙┆Sala SATV", base: "satv", mando: "directorsatv" },
  { cat: "🎖 SASD", com: "🎖📢┆comunicado", chat: "💬┆chat-sasd", voz: "🎙┆Sala SASD", base: "sheriff", mando: "alguacil" },
  { cat: "👮 SAPD", com: "👮📢┆comunicado", chat: "💬┆chat-sapd", voz: "🎙┆Sala SAPD", base: "policia", mando: "comisario" },
  { cat: "🕵 FBI", com: "🕵📢┆comunicado", chat: "💬┆chat-fbi", voz: "🎙┆Sala FBI", base: "fbi", mando: "director" },
  { cat: "🪖 SAEM", com: "🪖📢┆comunicado", chat: "💬┆chat-saem", voz: "🎙┆Sala SAEM", base: "militar", mando: "general" },
];

const SERVER_STRUCTURE = [
  {
    category: null,
    view: "everyone",
    channels: [
      { name: "📲┆descargas", type: "text", write: "none" },
      { name: "🌐┆web", type: "voice", connect: false },
      { name: "🌀┆discord", type: "voice", connect: false },
      { name: "🏙┆ip", type: "voice", connect: false },
      { name: "🌁┆chat-de-voz", type: "voice", connect: false },
      { name: "🌇┆rpg", type: "voice", connect: false },
      { name: "🗼┆practicas", type: "voice", connect: false },
      { name: "🔌┆puerto", type: "voice", connect: false },
    ],
  },
  {
    category: "📃 REGISTROS",
    view: "everyone",
    write: "none",
    channels: [{ name: "🚩┆sanciones", type: "text", write: STAFF_MOD }],
  },
  {
    category: "📤 INICIO",
    view: "everyone",
    write: "none",
    channels: [
      { name: "✅┆verificacion", type: "text", write: "all", hideFrom: ["usuario"], wire: "verify" },
      { name: "🎍┆bienvenidas", type: "text", wire: "welcome" },
      { name: "👋┆despedidas", type: "text", wire: "leave" },
      { name: "📖┆reglas", type: "text" },
      { name: "📰┆anuncios", type: "text" },
      { name: "📈┆actualizaciones", type: "text" },
      { name: "🎭┆autoroles", type: "text", wire: "autoroles" },
      { name: "🇫┆facebook", type: "text" },
      { name: "👷┆trabajos", type: "text" },
      { name: "☠️┆bandas", type: "text" },
      { name: "🏆┆habilidades", type: "text" },
      { name: "📊┆economia", type: "text" },
      { name: "💼┆millonarios", type: "text" },
      { name: "🔔┆invitados", type: "text" },
      { name: "📢┆sampcity-chat-de-voz", type: "voice" },
      { name: "🏙┆sampcity-rpg", type: "voice" },
      { name: "🔫┆sampcity-practicas", type: "voice" },
    ],
  },
  {
    category: "ℹ️ INFORMACIÓN",
    view: "everyone",
    write: "none",
    channels: [
      { name: "📚┆normativas", type: "text" },
      { name: "🎭┆rolear", type: "text" },
      { name: "🚀┆guia-nuevos", type: "text" },
      { name: "❓┆faq", type: "text" },
      { name: "⌨️┆comandos", type: "text" },
      { name: "👨‍💻┆staff", type: "text" },
      { name: "💎┆citycoins", type: "text" },
      { name: "👑┆vip", type: "text" },
      { name: "🥇┆socio", type: "text" },
      { name: "🌌┆boost", type: "text" },
      { name: "🐱┆emojis", type: "text" },
      { name: "🔺┆youtubers", type: "text" },
      { name: "♪┆tiktokers", type: "text" },
      { name: "🤝┆alianzas", type: "text" },
      { name: "🌃┆2021", type: "text" },
      { name: "🌄┆2022", type: "text" },
    ],
  },
  {
    category: "💼 FACCIONES",
    view: "everyone",
    write: "none",
    channels: [
      { name: "🎖┆sheriff", type: "text" },
      { name: "👮┆policia", type: "text" },
      { name: "🕵┆fbi", type: "text" },
      { name: "🪖┆militar", type: "text" },
      { name: "💀┆banda", type: "text" },
      { name: "📋┆resultados-postulaciones", type: "text", write: ["evaluador", ...STAFF_MOD] },
    ],
  },
  {
    category: "🔘 GENERAL",
    view: "members",
    write: "all",
    channels: [
      { name: "💬┆chat", type: "text" },
      { name: "📴┆off-topic", type: "text" },
      { name: "📷┆imagenes", type: "text" },
      { name: "🤳┆selfie", type: "text" },
      { name: "📸┆capturas-rp", type: "text" },
      { name: "🎬┆clips-rp", type: "text" },
      { name: "🎨┆arte", type: "text" },
      { name: "🏎┆tuning", type: "text" },
      { name: "🐳┆twitter", type: "text" },
      { name: "🏬┆mil-anuncios", type: "text" },
      { name: "🎥┆videos", type: "text" },
      { name: "📺┆directos", type: "text" },
      { name: "🎦┆memes", type: "text" },
      { name: "🤖┆comandos-bot", type: "text" },
      { name: "🎂┆cumpleaños", type: "text", write: "none", wire: "birthdays" },
      { name: "🗳️┆sugerencias", type: "text", write: "none", wire: "suggestions" },
      { name: "🚀┆nuevos-boosters", type: "text", write: "none", wire: "boosts" },
    ],
  },
  {
    category: "🎉 EVENTOS",
    view: "members",
    write: ["organizador", ...STAFF_MOD],
    channels: [
      { name: "🎉┆eventos", type: "text" },
      { name: "🎁┆sorteos", type: "text" },
      { name: "📊┆encuestas", type: "text" },
      { name: "🏆┆ganadores", type: "text" },
      { name: "💬┆eventos-chat", type: "text", write: "all" },
      { name: "🎪┆Sala de Eventos", type: "voice", write: "all" },
    ],
  },
  {
    category: "🕹 MINIJUEGOS",
    view: "members",
    write: "all",
    channels: [
      { name: "🕴┆fortuna", type: "text" },
      { name: "🎰┆casino", type: "text" },
      { name: "🎲┆juegos", type: "text" },
      { name: "💞┆familia", type: "text" },
      { name: "📈┆ranking", type: "text" },
      { name: "🆙┆niveles", type: "text", write: "none", wire: "levels" },
    ],
  },
  {
    category: "🔊 VOZ",
    view: "members",
    write: "all",
    channels: [
      { name: "🔊┆General 1", type: "voice" },
      { name: "🔊┆General 2", type: "voice" },
      { name: "🎮┆Gaming", type: "voice" },
      { name: "🎵┆Música", type: "voice" },
      { name: "🎙┆Sala RP 1", type: "voice" },
      { name: "🎙┆Sala RP 2", type: "voice" },
      { name: "🔒┆Privada 1", type: "voice", userLimit: 2 },
      { name: "🔒┆Privada 2", type: "voice", userLimit: 2 },
      { name: "🤫┆AFK", type: "voice", wire: "afk" },
    ],
  },
  {
    category: "👨‍💻 SOPORTE",
    view: "everyone",
    write: "none",
    channels: [
      { name: "🔎┆soporte", type: "text", wire: "ticketpanel" },
      { name: "🆘┆Sala de espera soporte", type: "voice", write: "all" },
      { name: "⛓️┆jail-ooc", type: "text", write: "all", view: ["jail", ...STAFF_MOD], jail: true },
    ],
  },
  { category: "🎫 TICKETS", view: ["soporte", ...STAFF_MOD], write: "all", wireCategory: "tickets", channels: [] },

  // Categorías de facciones: comunicados visibles para verificados; chat y voz solo de la facción.
  ...FACTIONS.map((f) => ({
    category: f.cat,
    view: "members",
    write: "none",
    channels: [
      { name: f.com, type: "text", write: [f.mando] },
      { name: f.chat, type: "text", view: [f.base, f.mando, ...STAFF_MOD], write: "all" },
      { name: f.voz, type: "voice", view: [f.base, f.mando, ...STAFF_MOD], write: "all" },
    ],
  })),

  // Zona privada del staff
  {
    category: "🔒 STAFF",
    view: STAFF_ALL,
    write: "all",
    channels: [
      { name: "📢┆staff-anuncios", type: "text", write: STAFF_TOP },
      { name: "💬┆staff-chat", type: "text" },
      { name: "📜┆reglamento-staff", type: "text", write: STAFF_TOP },
      { name: "📝┆tareas-staff", type: "text" },
      { name: "🧾┆evidencias", type: "text" },
      { name: "🔨┆apelaciones-ban", type: "text" },
      { name: "🗳️┆votaciones-staff", type: "text" },
      { name: "🎫┆soporte-staff", type: "text" },
      { name: "🤖┆comandos-staff", type: "text" },
      { name: "🕹┆comandos-admin", type: "text" },
      { name: "🔒┆Staff 1", type: "voice" },
      { name: "🔒┆Reunión Staff", type: "voice" },
    ],
  },
  {
    category: "👑 DIRECCIÓN",
    view: STAFF_TOP,
    write: "all",
    channels: [
      { name: "👑┆direccion", type: "text" },
      { name: "🧾┆gestion-staff", type: "text" },
      { name: "📊┆reportes-direccion", type: "text" },
      { name: "⚙️┆configuracion", type: "text" },
      { name: "🗄️┆registro-decisiones", type: "text" },
      { name: "🔒┆Dirección", type: "voice" },
    ],
  },
  {
    category: "📜 LOGS",
    view: STAFF_MOD,
    write: "none",
    key: "logs",
    channels: [
      { name: "📜┆server-logs", type: "text", wire: "logs" },
      { name: "📥┆log-entradas-salidas", type: "text" },
      { name: "💬┆log-mensajes", type: "text" },
      { name: "🔨┆log-moderacion", type: "text" },
      { name: "🎫┆log-tickets", type: "text", wire: "ticketlogs" },
      { name: "🖥┆log-servidor-samp", type: "text" },
      { name: "💰┆log-economia", type: "text" },
      { name: "🔐┆log-admin-ingame", type: "text" },
    ],
  },
  {
    category: "💻 DESARROLLO",
    view: [...DEV, ...STAFF_TOP],
    write: "all",
    channels: [
      { name: "💻┆dev-chat", type: "text" },
      { name: "🐛┆bugs-reportados", type: "text" },
      { name: "🗺┆mapeo", type: "text" },
      { name: "🧪┆servidor-de-pruebas", type: "text" },
      { name: "📎┆cambios-y-commits", type: "text" },
      { name: "💻┆Dev", type: "voice" },
    ],
  },
  {
    category: "🏛 LÍDERES",
    view: ["lider", ...MANDOS, ...STAFF_MOD],
    write: "all",
    channels: [
      { name: "🏴‍☠️┆lideres-bandas", type: "text", view: ["lider", ...STAFF_MOD] },
      { name: "🎖┆mando-legal", type: "text", view: [...MANDOS, ...STAFF_MOD] },
      { name: "🎙┆Reunión de líderes", type: "voice" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve la "clave" de contenido de un canal a partir de su nombre
 * (sin el emoji/separador), para buscarlo en CONTENT/TOPICS.
 */
function contentKey(channelName) {
  const key = channelName.split("┆")[1];
  return key || null;
}

/**
 * Construye los permisos (overwrites) de un canal o categoría a partir de
 * su spec { view, write, connect, jail, hideFrom, type }.
 */
function buildOverwrites(guild, R, spec) {
  const map = new Map();
  const add = (id, kind, flags) => {
    if (!id) return;
    if (!map.has(id)) map.set(id, { allow: new Set(), deny: new Set() });
    for (const f of flags) map.get(id)[kind].add(f);
  };
  const ids = (keys) => keys.map((k) => R[k] && R[k].id).filter(Boolean);
  const isVoice = spec.type === "voice";
  const everyone = guild.id;

  // Quién puede ver
  const view = spec.view === undefined ? "everyone" : spec.view;
  if (view !== "everyone") {
    add(everyone, "deny", [P.ViewChannel]);
    const allowed =
      view === "members" ? ["usuario", ...STAFF_ALL, ...DEV, ...MANDOS] : view;
    for (const id of ids(allowed)) add(id, "allow", [P.ViewChannel]);
  }
  for (const id of ids(spec.hideFrom || [])) add(id, "deny", [P.ViewChannel]);

  // Quién puede escribir / hablar
  const sendFlags = isVoice
    ? [P.Speak]
    : [
        P.SendMessages,
        P.SendMessagesInThreads,
        P.CreatePublicThreads,
        P.CreatePrivateThreads,
      ];
  const write = spec.write === undefined ? "all" : spec.write;
  if (write !== "all") {
    add(everyone, "deny", sendFlags);
    const writers = write === "none" ? STAFF_TOP : [...STAFF_TOP, ...write];
    for (const id of ids(writers)) add(id, "allow", sendFlags);
  }

  if (spec.connect === false) add(everyone, "deny", [P.Connect]);

  // Sanciones: muteado y jail no pueden hablar (salvo jail en su canal)
  const muteFlags = [...sendFlags, P.AddReactions];
  if (spec.jail) {
    for (const id of ids(["jail"])) add(id, "allow", [P.ViewChannel, P.SendMessages]);
  } else {
    for (const id of ids(["muteado", "jail"])) add(id, "deny", muteFlags);
  }

  return [...map.entries()].map(([id, e]) => ({
    id,
    allow: [...e.allow],
    deny: [...e.deny],
  }));
}

async function saveOne(Model, filter, update) {
  return Model.findOneAndUpdate(filter, update, { upsert: true, new: true });
}

/** Publica un menú de autoroles y lo registra en la base de datos del bot. */
async function sendRoleMenu(client, guild, channel, { category, title, desc, placeholder, entries }) {
  const valid = entries.filter((e) => e.role);
  if (!valid.length) return;

  const Roles = {};
  for (const e of valid) Roles[e.emoji] = [e.role.id, { id: null, raw: e.emoji }];

  const menu = new Discord.StringSelectMenuBuilder()
    .setCustomId("reaction_select")
    .setPlaceholder(placeholder)
    .setMinValues(1)
    .setMaxValues(valid.length)
    .addOptions(
      valid.map((e) => ({
        label: e.label,
        description: "Pulsa para añadir o quitar este rol",
        emoji: e.emoji,
        value: e.emoji,
      })),
    );

  const list = valid.map((e) => `${e.emoji} | ${e.role}`).join("\n");
  const msg = await client.embed(
    {
      title,
      desc: `${desc}\n\n${list}`,
      components: [new Discord.ActionRowBuilder().addComponents(menu)],
    },
    channel,
  );
  if (!msg) throw new Error("No se pudo enviar el menú de autoroles");

  await saveOne(
    require("../../database/models/reactionRoles"),
    { Guild: guild.id, Category: category },
    { Guild: guild.id, Category: category, Message: msg.id, Roles },
  );
}

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const guild = interaction.guild;

  const confirmRow = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder()
      .setCustomId("sampcity_confirmWipe")
      .setEmoji("🧨")
      .setLabel("Sí, borrar todo y crear la plantilla")
      .setStyle(Discord.ButtonStyle.Danger),
    new Discord.ButtonBuilder()
      .setCustomId("sampcity_cancelWipe")
      .setEmoji("✖️")
      .setLabel("Cancelar")
      .setStyle(Discord.ButtonStyle.Secondary),
  );

  const warnEmbed = client
    .templateEmbed()
    .setTitle(`⚠️・Esto va a borrar TODO el servidor`)
    .setDescription(
      `Vas a ejecutar un borrado completo de **${guild.name}**:\n\n` +
        `• Se eliminan **todos los canales y categorías**.\n` +
        `• Se eliminan **todos los roles** (menos @everyone y los roles administrados por bots/integraciones, que Discord no deja borrar).\n` +
        `• Después se crean **los roles** (dirección, staff, facciones, comunidad, sanciones, progresión, años, avisos y países) y **toda la estructura** de SampCity con sus permisos. Los canales con contenido real llevan su embed; el resto queda vacío.\n` +
        `• Se te asignará el rol **🔱 FUNDADOR** para que no pierdas el acceso de administrador.\n\n` +
        `Puede tardar varios minutos.\n\n` +
        `**Esta acción no se puede deshacer.** ¿Confirmas?`,
    )
    .setColor(client.config.colors.error);

  await interaction.editReply({
    embeds: [warnEmbed],
    components: [confirmRow],
  });

  let confirmation;
  try {
    confirmation = await interaction.channel.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      time: 30000,
    });
  } catch {
    return interaction
      .editReply({
        content: "⌛ Se acabó el tiempo, no se hizo ningún cambio.",
        embeds: [],
        components: [],
      })
      .catch(() => {});
  }

  if (confirmation.customId === "sampcity_cancelWipe") {
    return confirmation.update({
      content: "❌ Cancelado, no se tocó nada.",
      embeds: [],
      components: [],
    });
  }

  await confirmation.update({
    content: "🧹 Preparando todo, esto puede tardar varios minutos...",
    embeds: [],
    components: [],
  });

  // Canal de progreso: se crea primero (oculto) para poder informar del
  // avance aunque el canal donde se corrió el comando termine borrado.
  const progress = await guild.channels.create({
    name: "📃┆setup-sampcity",
    type: Discord.ChannelType.GuildText,
    permissionOverwrites: [{ id: guild.id, deny: [P.ViewChannel] }],
  });

  const log = async (text) => {
    await progress.send({ content: text }).catch(() => {});
  };

  await log("🧹 **Borrando roles del servidor…**");

  const oldRoles = guild.roles.cache.filter(
    (role) => role.id !== guild.id && !role.managed,
  );
  for (const role of oldRoles.values()) {
    await role.delete("SampCity setup: limpieza total").catch(() => {});
  }

  await log("🧹 **Borrando canales del servidor…**");

  const oldChannels = guild.channels.cache.filter((c) => c.id !== progress.id);
  for (const channel of oldChannels.values()) {
    await channel.delete("SampCity setup: limpieza total").catch(() => {});
  }

  // Permisos base de @everyone
  try {
    await guild.roles.everyone.setPermissions(EVERYONE_PERMS);
  } catch (err) {
    await log(`⚠️ No se pudieron ajustar los permisos base de @everyone: ${err.message}`);
  }

  // ── Roles ──
  await log(`✅ Servidor limpio. **Creando ${ROLE_DEFS.length} roles…**`);

  // Se crean de mayor a menor: cada rol nuevo queda por debajo de los anteriores
  // y siempre por debajo del rol del bot.
  const R = {};
  for (const def of ROLE_DEFS) {
    try {
      R[def.key] = await guild.roles.create({
        name: def.name,
        color: def.color || undefined,
        hoist: !!def.hoist,
        mentionable: !!def.mentionable,
        permissions: def.perms || [],
        reason: "SampCity setup",
      });
    } catch (err) {
      await log(`⚠️ No se pudo crear el rol **${def.name}**: ${err.message}`);
    }
  }
  await log(`✅ Roles listos: **${Object.keys(R).length}/${ROLE_DEFS.length}**.`);

  // Al ejecutor se le devuelve el acceso (sus roles antiguos se borraron)
  try {
    const me = await guild.members.fetch(interaction.user.id);
    await me.roles.add([R.fundador, R.usuario].filter(Boolean));
  } catch (err) {
    await log(`⚠️ No pude darte el rol FUNDADOR: ${err.message}`);
  }

  // ── Canales ──
  await log("🏗️ **Creando la estructura de SampCity…**");

  const wired = {}; // canales que luego se conectan con el bot
  let logsCategory;

  for (const block of SERVER_STRUCTURE) {
    let parent;

    if (block.category) {
      try {
        parent = await guild.channels.create({
          name: block.category,
          type: Discord.ChannelType.GuildCategory,
          permissionOverwrites: buildOverwrites(guild, R, {
            view: block.view,
            write: block.write,
            type: "category",
          }),
        });
        if (block.key === "logs") logsCategory = parent;
        if (block.wireCategory) wired[block.wireCategory] = parent;
      } catch (err) {
        await log(
          `⚠️ No se pudo crear la categoría **${block.category}**: ${err.message}`,
        );
      }
    }

    for (const chDef of block.channels) {
      try {
        const key = contentKey(chDef.name);
        const isVoice = chDef.type === "voice";

        const spec = {
          view: chDef.view !== undefined ? chDef.view : block.view,
          write: chDef.write !== undefined ? chDef.write : block.write,
          hideFrom: chDef.hideFrom,
          connect: chDef.connect,
          jail: chDef.jail,
          type: chDef.type,
        };

        const ch = await guild.channels.create({
          name: chDef.name,
          type: isVoice
            ? Discord.ChannelType.GuildVoice
            : Discord.ChannelType.GuildText,
          parent: parent ? parent.id : undefined,
          topic: !isVoice && TOPICS[key] ? TOPICS[key] : undefined,
          userLimit: isVoice && chDef.userLimit ? chDef.userLimit : undefined,
          permissionOverwrites: buildOverwrites(guild, R, spec),
        });

        if (chDef.wire) wired[chDef.wire] = ch;

        if (!isVoice && key && CONTENT[key]) {
          for (const embedOptions of CONTENT[key]) {
            await client.embed(embedOptions, ch);
          }
        }
      } catch (err) {
        await log(`⚠️ No se pudo crear **${chDef.name}**: ${err.message}`);
      }
    }

    if (block.category) {
      await log(`✅ Categoría **${block.category}** lista.`);
    }
  }

  // ── Conexión con los sistemas del bot ──
  await log("🔌 **Conectando canales con el bot…**");

  const M = (name) => require(`../../database/models/${name}`);
  const simple = [
    ["welcome", "welcomeChannels"],
    ["leave", "leaveChannels"],
    ["logs", "logChannels"],
    ["levels", "levelChannels"],
    ["boosts", "boostChannels"],
    ["suggestions", "suggestionChannels"],
    ["birthdays", "birthdaychannels"],
  ];

  for (const [wireKey, model] of simple) {
    if (!wired[wireKey]) continue;
    try {
      await saveOne(M(model), { Guild: guild.id }, { Guild: guild.id, Channel: wired[wireKey].id });
    } catch (err) {
      await log(`⚠️ No se pudo conectar **${wireKey}**: ${err.message}`);
    }
  }

  // Verificación (captcha) → rol USUARIO
  if (wired.verify && R.usuario) {
    try {
      await saveOne(
        M("verify"),
        { Guild: guild.id },
        { Guild: guild.id, Channel: wired.verify.id, Role: R.usuario.id },
      );
      const row = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setCustomId("Bot_verify")
          .setEmoji("✅")
          .setLabel("Verificarme")
          .setStyle(Discord.ButtonStyle.Success),
      );
      await client.embed(
        {
          title: "✅・Verificación SampCity RolePlay Android 📱 | 💻 PC",
          desc: "Pulsa el botón para verificarte.\nEl bot te mostrará un captcha: **escríbelo aquí mismo** para desbloquear el resto del servidor.",
          color: NORMATIVAS_COLOR,
          components: [row],
        },
        wired.verify,
      );
    } catch (err) {
      await log(`⚠️ No se pudo configurar la verificación: ${err.message}`);
    }
  }

  // Tickets → panel en #soporte (botón ya incluido en el embed), logs y rol de soporte
  if (wired.ticketpanel && wired.tickets && R.soporte) {
    try {
      await saveOne(
        M("tickets"),
        { Guild: guild.id },
        {
          Guild: guild.id,
          Channel: wired.ticketpanel.id,
          Category: wired.tickets.id,
          Role: R.soporte.id,
          Logs: wired.ticketlogs ? wired.ticketlogs.id : undefined,
        },
      );
    } catch (err) {
      await log(`⚠️ No se pudo configurar los tickets: ${err.message}`);
    }
  }

  // Autoroles: países y avisos/plataforma
  if (wired.autoroles) {
    try {
      const entriesFor = (self) =>
        ROLE_DEFS.filter((d) => d.self === self).map((d) => ({
          emoji: d.emoji,
          label: d.label,
          role: R[d.key],
        }));

      await sendRoleMenu(client, guild, wired.autoroles, {
        category: "paises",
        title: "🌎・Elige tu país",
        desc: "Selecciona tu país para que la comunidad sepa de dónde eres. Puedes cambiarlo cuando quieras.",
        placeholder: "🌎 Selecciona tu país",
        entries: entriesFor("paises"),
      });

      await sendRoleMenu(client, guild, wired.autoroles, {
        category: "intereses",
        title: "🔔・Avisos y plataforma",
        desc: "Elige los avisos que quieres recibir y en qué plataforma juegas.",
        placeholder: "🔔 Selecciona tus roles",
        entries: entriesFor("intereses"),
      });
    } catch (err) {
      await log(`⚠️ No se pudieron crear los menús de autoroles: ${err.message}`);
    }
  }

  // Ajustes del servidor
  try {
    if (wired.afk) {
      await guild.setAFKChannel(wired.afk);
      await guild.setAFKTimeout(300);
    }
    await guild.setDefaultMessageNotifications(
      Discord.GuildDefaultMessageNotifications.OnlyMentions,
    );
  } catch (err) {
    await log(`⚠️ No se pudieron aplicar los ajustes del servidor: ${err.message}`);
  }

  // El canal de progreso pasa a la zona de logs (solo staff)
  if (logsCategory) {
    await progress
      .edit({
        parent: logsCategory.id,
        permissionOverwrites: buildOverwrites(guild, R, {
          view: STAFF_MOD,
          write: "none",
          type: "text",
        }),
      })
      .catch(() => {});
  }

  await log(
    "🎉 **Listo — SampCity RolePlay quedó configurado.**\n" +
      "Recuerda reemplazar los marcadores `{{...}}` (IP, puerto, web) y asignar los roles de staff a tu equipo.",
  );
};
