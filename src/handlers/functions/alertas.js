const Discord = require("discord.js");

const ALERTAS = require("../../assets/data/alertas");
const { textChannel, norm } = require("../../assets/utils/guildLookup");

/*
 * Alertas por roles (lista en src/assets/data/alertas.js):
 * - En el canal 🔔┆alertas el bot mantiene un panel con un botón por alerta ("alerta:<key>") más Todas, Ninguna y
 *   Mis alertas. Cada botón pone o quita el rol "🔔 <nombre>" (se crea solo si falta).
 * - Cuando el staff (Gestionar mensajes), el propio bot o un webhook publica en el canal de una alerta, el bot
 *   menciona su rol una vez (como mucho una mención por canal cada 2 minutos, para no avisar varias veces seguidas).
 */
const TITULO = "🔔・Alertas de SampCity";
const PREFIJO = "🔔 ";
const ESPERA = 2 * 60000;

const rolNombre = (a) => PREFIJO + a.nombre;
function rolDe(guild, key) {
  const a = ALERTAS.find((x) => x.key === key);
  return a ? guild.roles.cache.find((r) => r.name === rolNombre(a)) || null : null;
}

async function asegurarRoles(guild) {
  for (const a of ALERTAS) {
    if (rolDe(guild, a.key)) continue;
    await guild.roles
      .create({ name: rolNombre(a), mentionable: false, permissions: [], reason: "Alertas del servidor (canal alertas)" })
      .catch((e) => console.log("[alertas] no se pudo crear el rol", a.nombre, e.message));
  }
}

function panel(client, guild) {
  const lineas = ALERTAS.map((a) => `${a.emoji} **${a.nombre}**: ${a.desc}`);
  const embed = client
    .templateEmbed()
    .setTitle(TITULO)
    .setColor("#E8392F")
    .setDescription(
      "Elige de qué quieres enterarte. Toca un botón para **activar** esa alerta y otra vez para **quitarla**: " +
        "te llegará una mención solo cuando haya algo de ese tema.\n\n" +
        lineas.join("\n"),
    )
    .setFooter({ text: "Puedes cambiarlas cuando quieras · Mis alertas te dice cuáles tienes" });
  const botones = ALERTAS.map((a) =>
    new Discord.ButtonBuilder().setCustomId(`alerta:${a.key}`).setLabel(a.nombre).setEmoji(a.emoji).setStyle(Discord.ButtonStyle.Secondary),
  );
  botones.push(
    new Discord.ButtonBuilder().setCustomId("alerta:todas").setLabel("Todas").setEmoji("✅").setStyle(Discord.ButtonStyle.Success),
    new Discord.ButtonBuilder().setCustomId("alerta:ninguna").setLabel("Ninguna").setEmoji("🔕").setStyle(Discord.ButtonStyle.Danger),
    new Discord.ButtonBuilder().setCustomId("alerta:mias").setLabel("Mis alertas").setEmoji("📋").setStyle(Discord.ButtonStyle.Primary),
  );
  const filas = [];
  for (let i = 0; i < botones.length; i += 5) filas.push(new Discord.ActionRowBuilder().addComponents(botones.slice(i, i + 5)));
  return { embeds: [embed], components: filas.slice(0, 5) };
}

module.exports = (client) => {
  client.alertRole = rolDe;

  // Panel en 🔔┆alertas: se edita el del bot si ya existe (así se actualiza al cambiar la lista)
  async function publicarPanel(guild) {
    const canal = textChannel(guild, /^alertas$/);
    if (!canal) return null;
    await asegurarRoles(guild);
    const cuerpo = panel(client, guild);
    const recientes = await canal.messages.fetch({ limit: 20 }).catch(() => null);
    const viejo = recientes?.find((m) => m.author.id === client.user.id && m.embeds[0]?.title === TITULO);
    return viejo ? viejo.edit(cuerpo).catch(() => null) : canal.send(cuerpo).catch(() => null);
  }
  client.updateAlertsPanel = publicarPanel;

  client.once(Discord.Events.ClientReady, () => {
    setTimeout(() => {
      for (const guild of client.guilds.cache.values()) publicarPanel(guild).catch((e) => console.log("[alertas]", e.message));
    }, 15000);
  });

  // Botones del panel
  client.on(Discord.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton() || !interaction.customId.startsWith("alerta:") || !interaction.guild) return;
    const key = interaction.customId.slice(7);
    const member = interaction.member;
    const responder = (content) => interaction.reply({ content, flags: Discord.MessageFlags.Ephemeral }).catch(() => {});
    await asegurarRoles(interaction.guild);
    const roles = ALERTAS.map((a) => ({ a, rol: rolDe(interaction.guild, a.key) })).filter((x) => x.rol);

    if (key === "mias") {
      const mias = roles.filter((x) => member.roles.cache.has(x.rol.id)).map((x) => `${x.a.emoji} ${x.a.nombre}`);
      return responder(mias.length ? `🔔 Tienes activadas: ${mias.join(" · ")}` : "🔕 No tienes ninguna alerta activada.");
    }
    if (key === "todas" || key === "ninguna") {
      const ids = roles.map((x) => x.rol.id);
      const ok = await (key === "todas" ? member.roles.add(ids) : member.roles.remove(ids)).then(() => true).catch(() => false);
      if (!ok) return responder("❌ No pude cambiar tus roles. Avisa al staff.");
      return responder(key === "todas" ? "✅ Activaste **todas** las alertas." : "🔕 Quitaste **todas** las alertas.");
    }
    const x = roles.find((r) => r.a.key === key);
    if (!x) return responder("❌ Esa alerta ya no existe.");
    const tiene = member.roles.cache.has(x.rol.id);
    const ok = await (tiene ? member.roles.remove(x.rol) : member.roles.add(x.rol)).then(() => true).catch(() => false);
    if (!ok) return responder("❌ No pude cambiar tus roles. Avisa al staff.");
    return responder(tiene ? `🔕 Quitaste la alerta de **${x.a.emoji} ${x.a.nombre}**.` : `🔔 Activaste la alerta de **${x.a.emoji} ${x.a.nombre}**.`);
  });

  // Menciones automáticas al publicar en el canal de una alerta
  const ultima = new Map(); // canal -> hora de la última mención
  client.on(Discord.Events.MessageCreate, async (message) => {
    if (!message.guild || !message.channel) return;
    if (message.author.id === client.user.id && message.content.startsWith("🔔")) return; // nuestra propia mención
    const nombre = norm(message.channel.name);
    const a = ALERTAS.find((x) => x.canales.some((re) => re.test(nombre)));
    if (!a) return;
    const staff =
      message.webhookId || message.author.id === client.user.id ||
      message.member?.permissions.has(Discord.PermissionFlagsBits.ManageMessages);
    if (!staff) return;
    const rol = rolDe(message.guild, a.key);
    if (!rol || message.mentions.roles.has(rol.id) || message.mentions.everyone) return;
    if (Date.now() - (ultima.get(message.channel.id) || 0) < ESPERA) return;
    ultima.set(message.channel.id, Date.now());
    await message.channel
      .send({ content: `🔔 ${rol} · ${a.emoji} ${a.desc}. *(Elige tus alertas en ${textChannel(message.guild, /^alertas$/) || "el canal de alertas"})*`, allowedMentions: { roles: [rol.id] } })
      .catch(() => {});
  });
};
