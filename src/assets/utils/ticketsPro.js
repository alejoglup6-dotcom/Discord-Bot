/*
 * Tickets de SampCity.
 *  - Panel con un menú de tipos (src/assets/data/tickets.js). Cada tipo abre su formulario; con las respuestas se crea
 *    el canal en la categoría de tickets, con la cuenta del juego vinculada (nombre, nivel, advertencias) y avisando al
 *    rol de soporte y, según el tipo, a los rangos de staff que tocan (reportes, apelaciones, tienda).
 *  - Pueden abrirlo también los que aún no se verificaron (justo para "No puedo verificarme").
 *  - Botones: Atender (staff), Prioridad (staff), Cerrar con motivo (staff o el autor), Transcripción y Avisar.
 *  - Al cerrar: transcripción al canal de registros y al autor por MD, con botones para valorar la atención (1-5).
 *  - Solos: aviso al autor tras TICKETS_AVISO_H horas sin mensajes, cierre tras TICKETS_CIERRE_H y borrado del canal
 *    cerrado tras TICKETS_BORRAR_H (la transcripción ya quedó guardada).
 * La configuración (categoría, rol de soporte, canal del panel y registros) es la de /setup tickets (modelo tickets).
 */
const Discord = require("discord.js");
const Tickets = require("../../database/models/tickets");
const TicketChannels = require("../../database/models/ticketChannels");
const Info = require("../../database/models/ticketInfo");
const { TYPES, BY_KEY, TIMES, PRIORITIES } = require("../data/tickets");
const rangos = require("../data/rangos");
const { brandEmbed, COLORS } = require("./brand");

const P = Discord.PermissionsBitField.Flags;
const USER_PERMS = [P.ViewChannel, P.SendMessages, P.AttachFiles, P.ReadMessageHistory, P.AddReactions, P.EmbedLinks];
const hours = (k) => {
  const v = parseFloat(process.env[`TICKETS_${{ remindH: "AVISO", closeH: "CIERRE", deleteH: "BORRAR" }[k]}_H`]);
  return Number.isFinite(v) && v >= 0 ? v : TIMES[k];
};
const ephemeral = { flags: Discord.MessageFlags.Ephemeral };

// ------------------------------------------------------------------ staff

// Roles de staff del juego (Discord) de un nivel para arriba: [Role]
function staffRolesFrom(guild, minLevel) {
  if (!minLevel) return [];
  const names = Object.entries(rangos.STAFF)
    .filter(([lvl]) => Number(lvl) >= minLevel)
    .map(([, key]) => rangos.BY_KEY.get(key)?.role)
    .filter(Boolean);
  return guild.roles.cache.filter((r) => names.includes(r.name)).map((r) => r);
}

function isStaff(member, config) {
  if (!member) return false;
  if (member.permissions?.has(P.ManageMessages) || member.permissions?.has(P.Administrator)) return true;
  return Boolean(config?.Role && member.roles.cache.has(config.Role));
}

// ------------------------------------------------------------------ panel

function panel(guild) {
  const embed = brandEmbed(guild, {
    title: "SOPORTE · ABRE UN TICKET",
    desc:
      "Elige en el menú de abajo qué necesitas. Te pediremos unos datos y se abrirá un canal privado solo para ti y el staff.\n\n" +
      TYPES.map((t) => `${t.emoji} **${t.label}** · ${t.desc}`).join("\n") +
      "\n\n• Un ticket abierto a la vez por persona.\n• Si no respondes en un par de días, el ticket se cierra solo.\n" +
      "• Al cerrarlo recibes la conversación completa por mensaje privado.",
  });
  const menu = new Discord.StringSelectMenuBuilder()
    .setCustomId("Bot_ticketType")
    .setPlaceholder("¿Qué necesitas?")
    .addOptions(TYPES.map((t) => ({ label: t.label, value: t.key, description: t.desc.slice(0, 100), emoji: t.emoji })));
  return { embeds: [embed], components: [new Discord.ActionRowBuilder().addComponents(menu)] };
}

// ¿El mensaje es un panel de tickets (nuevo o viejo)?
const isPanelMessage = (m) =>
  m.components?.some((row) => row.components?.some((c) => c.customId === "Bot_ticketType" || c.customId === "Bot_openticket"));

// ------------------------------------------------------------------ abrir

async function openTicketOf(guild, userId) {
  const row = await TicketChannels.findOne({ Guild: guild.id, creator: userId, resolved: false });
  if (!row) return null;
  if (!guild.channels.cache.get(row.channelID)) {
    await TicketChannels.deleteOne({ Guild: guild.id, channelID: row.channelID }); // canal borrado a mano
    return null;
  }
  return row;
}

// Menú del panel (o botón viejo "Abrir ticket"): comprueba el límite y muestra el formulario del tipo
async function onSelect(client, interaction) {
  const config = await Tickets.findOne({ Guild: interaction.guild.id });
  if (!config?.Category) return interaction.reply({ content: "Los tickets aún no están configurados (/setup tickets).", ...ephemeral }).catch(() => {});
  const open = await openTicketOf(interaction.guild, interaction.user.id);
  if (open) return interaction.reply({ content: `Ya tienes un ticket abierto: <#${open.channelID}>. Ciérralo antes de abrir otro.`, ...ephemeral }).catch(() => {});

  // botón viejo: primero hay que elegir el tipo
  if (!interaction.isStringSelectMenu()) {
    const p = panel(interaction.guild);
    return interaction.reply({ components: p.components, ...ephemeral }).catch(() => {});
  }
  const type = BY_KEY.get(interaction.values[0]);
  if (!type) return;
  const modal = new Discord.ModalBuilder().setCustomId(`Bot_tp_form:${type.key}`).setTitle(`${type.label}`.slice(0, 45));
  for (const f of type.fields.slice(0, 5)) {
    modal.addComponents(
      new Discord.ActionRowBuilder().addComponents(
        new Discord.TextInputBuilder()
          .setCustomId(f.id)
          .setLabel(f.label.slice(0, 45))
          .setStyle(f.style === "long" ? Discord.TextInputStyle.Paragraph : Discord.TextInputStyle.Short)
          .setRequired(f.required !== false)
          .setMaxLength(f.max || 1000),
      ),
    );
  }
  await interaction.showModal(modal).catch(() => {});
  // deja el menú del panel sin selección para el siguiente
  if (interaction.message && !interaction.message.flags?.has?.(Discord.MessageFlags.Ephemeral)) {
    await interaction.message.edit(panel(interaction.guild)).catch(() => {});
  }
}

async function playerSummary(userId) {
  try {
    const samp = require("../../database/samp");
    if (!(await samp.isAvailable())) return null;
    const p = await samp.getLinkedPlayer(userId);
    if (!p) return { linked: false };
    const warns = await samp.countWarnings(p).catch(() => 0);
    return { linked: true, name: p.name, level: p.level, admin: Number(p.admin_level) || 0, warns };
  } catch {
    return null;
  }
}

function controls(priorityKey = "normal") {
  const pr = PRIORITIES.find((p) => p.key === priorityKey) || PRIORITIES[0];
  return [
    new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder().setCustomId("Bot_tp_claim").setLabel("Atender").setEmoji("✋").setStyle(Discord.ButtonStyle.Success),
      new Discord.ButtonBuilder().setCustomId("Bot_tp_prio").setLabel(`Prioridad: ${pr.label}`).setEmoji(pr.emoji).setStyle(Discord.ButtonStyle.Secondary),
      new Discord.ButtonBuilder().setCustomId("Bot_tp_close").setLabel("Cerrar").setEmoji("🔒").setStyle(Discord.ButtonStyle.Danger),
    ),
    new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder().setCustomId("Bot_transcriptTicket").setLabel("Transcripción").setEmoji("📝").setStyle(Discord.ButtonStyle.Secondary),
      new Discord.ButtonBuilder().setCustomId("Bot_noticeTicket").setLabel("Avisar al autor").setEmoji("🔔").setStyle(Discord.ButtonStyle.Secondary),
    ),
  ];
}

async function onForm(client, interaction) {
  const type = BY_KEY.get(interaction.customId.split(":")[1]);
  if (!type) return;
  await interaction.deferReply(ephemeral).catch(() => {});
  const guild = interaction.guild;
  const config = await Tickets.findOne({ Guild: guild.id });
  const category = config && guild.channels.cache.get(config.Category);
  if (!category) return interaction.editReply({ content: "Los tickets aún no están configurados (/setup tickets)." }).catch(() => {});
  if (await openTicketOf(guild, interaction.user.id)) return interaction.editReply({ content: "Ya tienes un ticket abierto." }).catch(() => {});

  const answers = type.fields.map((f) => ({ label: f.label, value: (interaction.fields.getTextInputValue(f.id) || "").trim() })).filter((a) => a.value);
  config.TicketCount = (Number(config.TicketCount) || 0) + 1;
  await config.save();
  const num = config.TicketCount;
  const id = String(num).padStart(4, "0");

  const support = config.Role && guild.roles.cache.get(config.Role);
  const extra = staffRolesFrom(guild, type.minStaff);
  const overwrites = [
    { id: guild.id, deny: [P.ViewChannel] },
    { id: interaction.user.id, allow: USER_PERMS },
    { id: client.user.id, allow: [...USER_PERMS, P.ManageChannels, P.ManageMessages] },
  ];
  for (const r of [support, ...extra].filter(Boolean)) overwrites.push({ id: r.id, allow: USER_PERMS });

  let channel;
  try {
    channel = await guild.channels.create({
      name: `「${type.emoji}」${type.key}-${id}`,
      parent: category.id,
      topic: `${type.label} · abierto por ${interaction.user.tag} (${interaction.user.id})`,
      permissionOverwrites: overwrites,
    });
  } catch (e) {
    return interaction.editReply({ content: `No pude crear el canal del ticket: ${e.message}` }).catch(() => {});
  }

  const acc = await playerSummary(interaction.user.id);
  await new TicketChannels({ Guild: guild.id, TicketID: num, channelID: channel.id, creator: interaction.user.id, claimed: "None" }).save();
  await new Info({
    Guild: guild.id,
    channelID: channel.id,
    TicketID: num,
    creator: interaction.user.id,
    type: type.key,
    answers: JSON.stringify(answers),
    player: acc?.linked ? acc.name : "",
    openedAt: new Date(),
  }).save();

  const accountText = !acc
    ? "No se pudo consultar"
    : acc.linked
      ? `**${acc.name}** · nivel ${acc.level}${acc.warns ? ` · ⚠️ ${acc.warns} advertencia(s)` : ""}`
      : "Sin vincular (no está verificado)";
  const embed = brandEmbed(guild, {
    title: `${type.label.toUpperCase()} · #${id}`,
    desc: `${interaction.user} gracias por escribirnos. Un miembro del staff te responderá aquí; mientras tanto puedes añadir capturas o más detalles.`,
    fields: [
      ...answers.map((a) => ({ name: a.label, value: a.value })),
      { name: "Cuenta del juego", value: accountText, inline: true },
      { name: "Prioridad", value: `${PRIORITIES[0].emoji} ${PRIORITIES[0].label}`, inline: true },
      { name: "Atiende", value: "Nadie todavía", inline: true },
    ],
  });
  const mentions = [interaction.user.toString(), ...[support, ...extra].filter(Boolean).map((r) => r.toString())].join(" ");
  const first = await channel.send({ content: mentions, embeds: [embed], components: controls() }).catch(() => null);
  await first?.pin().catch(() => {});

  const logs = config.Logs && guild.channels.cache.get(config.Logs);
  if (logs)
    await logs
      .send({
        embeds: [
          brandEmbed(guild, {
            title: `TICKET ABIERTO · #${id}`,
            color: COLORS.ok,
            fields: [
              { name: "Tipo", value: `${type.emoji} ${type.label}`, inline: true },
              { name: "Autor", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
              { name: "Canal", value: `${channel}`, inline: true },
              { name: "Cuenta", value: accountText },
            ],
          }),
        ],
      })
      .catch(() => {});

  return interaction.editReply({ content: `Ticket creado: ${channel}` }).catch(() => {});
}

// ------------------------------------------------------------------ atender y prioridad

async function ticketContext(interaction) {
  const config = await Tickets.findOne({ Guild: interaction.guild.id });
  const row = await TicketChannels.findOne({ Guild: interaction.guild.id, channelID: interaction.channel.id });
  const info = await Info.findOne({ Guild: interaction.guild.id, channelID: interaction.channel.id });
  return { config, row, info };
}

// Cambia un campo del primer mensaje del ticket (el fijado)
async function editField(interaction, name, value, components) {
  const msg = interaction.message?.author?.id === interaction.client.user.id ? interaction.message : null;
  if (!msg?.embeds?.[0]) return;
  const e = Discord.EmbedBuilder.from(msg.embeds[0]);
  const fields = (e.data.fields || []).map((f) => (f.name === name ? { ...f, value } : f));
  e.setFields(fields);
  await msg.edit({ embeds: [e], ...(components ? { components } : {}) }).catch(() => {});
}

async function onClaim(client, interaction) {
  const { config, row, info } = await ticketContext(interaction);
  if (!row) return interaction.reply({ content: "Este canal no es un ticket.", ...ephemeral }).catch(() => {});
  if (!isStaff(interaction.member, config)) return interaction.reply({ content: "Solo el staff puede atender tickets.", ...ephemeral }).catch(() => {});
  if (row.claimed && row.claimed !== "None") return interaction.reply({ content: `Ya lo atiende <@${row.claimed}>.`, ...ephemeral }).catch(() => {});
  row.claimed = interaction.user.id;
  await row.save();
  if (info) {
    info.claimedBy = interaction.user.id;
    info.claimedAt = new Date();
    await info.save();
  }
  await editField(interaction, "Atiende", `${interaction.user}`);
  return interaction.reply({ embeds: [brandEmbed(interaction.guild, { color: COLORS.ok, desc: `✋ **${interaction.member.displayName}** atiende este ticket.` })] }).catch(() => {});
}

async function onPriority(client, interaction) {
  const { config, row, info } = await ticketContext(interaction);
  if (!row || !info) return interaction.reply({ content: "Este canal no es un ticket del sistema nuevo.", ...ephemeral }).catch(() => {});
  if (!isStaff(interaction.member, config)) return interaction.reply({ content: "Solo el staff cambia la prioridad.", ...ephemeral }).catch(() => {});
  const i = PRIORITIES.findIndex((p) => p.key === info.priority);
  const next = PRIORITIES[(i + 1) % PRIORITIES.length];
  info.priority = next.key;
  await info.save();
  await editField(interaction, "Prioridad", `${next.emoji} ${next.label}`, controls(next.key));
  return interaction.reply({ content: `Prioridad: ${next.emoji} **${next.label}**`, ...ephemeral }).catch(() => {});
}

// ------------------------------------------------------------------ cerrar

async function onCloseButton(client, interaction) {
  const { config, row } = await ticketContext(interaction);
  if (!row) return interaction.reply({ content: "Este canal no es un ticket.", ...ephemeral }).catch(() => {});
  if (row.resolved) return interaction.reply({ content: "Este ticket ya está cerrado.", ...ephemeral }).catch(() => {});
  if (!isStaff(interaction.member, config) && interaction.user.id !== row.creator)
    return interaction.reply({ content: "Solo el staff o quien abrió el ticket pueden cerrarlo.", ...ephemeral }).catch(() => {});
  const modal = new Discord.ModalBuilder()
    .setCustomId("Bot_tp_closeForm")
    .setTitle("Cerrar ticket")
    .addComponents(
      new Discord.ActionRowBuilder().addComponents(
        new Discord.TextInputBuilder().setCustomId("motivo").setLabel("Motivo o solución").setStyle(Discord.TextInputStyle.Paragraph).setRequired(false).setMaxLength(500),
      ),
    );
  return interaction.showModal(modal).catch(() => {});
}

function ratingRow(guildId, channelId) {
  return new Discord.ActionRowBuilder().addComponents(
    [1, 2, 3, 4, 5].map((n) =>
      new Discord.ButtonBuilder().setCustomId(`Bot_tp_rate:${guildId}:${channelId}:${n}`).setLabel("★".repeat(n)).setStyle(n >= 4 ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Secondary),
    ),
  );
}

/*
 * Cierra el ticket del canal. by = usuario que lo cierra (o null = el bot, por inactividad). Lo usan el formulario de
 * cierre y el cierre automático.
 */
async function closeTicket(client, guild, channel, by, reason) {
  const config = await Tickets.findOne({ Guild: guild.id });
  const row = await TicketChannels.findOne({ Guild: guild.id, channelID: channel.id });
  if (!row || row.resolved) return false;
  const info = await Info.findOne({ Guild: guild.id, channelID: channel.id });
  const id = String(row.TicketID).padStart(4, "0");
  const type = info && BY_KEY.get(info.type);
  reason = (reason || "").trim() || "Sin motivo indicado";

  row.resolved = true;
  await row.save();
  if (info) {
    info.closedAt = new Date();
    info.closedBy = by ? by.id : client.user.id;
    info.reason = reason;
    await info.save();
  }
  await channel.permissionOverwrites.edit(row.creator, { ViewChannel: false, SendMessages: false }).catch(() => {});

  // para la transcripción (client.transcript lee el canal de interaction.channel)
  const fake = { channel, guild };
  const fields = [
    { name: "Tipo", value: type ? `${type.emoji} ${type.label}` : "Ticket", inline: true },
    { name: "Autor", value: `<@${row.creator}>`, inline: true },
    { name: "Atendió", value: row.claimed && row.claimed !== "None" ? `<@${row.claimed}>` : "Nadie", inline: true },
    { name: "Cerrado por", value: by ? `${by}` : "Cierre automático", inline: true },
    { name: "Motivo", value: reason },
  ];
  const logs = config?.Logs && guild.channels.cache.get(config.Logs);
  if (logs) {
    await logs.send({ embeds: [brandEmbed(guild, { title: `TICKET CERRADO · #${id}`, color: COLORS.dark, fields })] }).catch(() => {});
    await client.transcript?.(fake, logs).catch(() => {});
  }
  const author = await client.users.fetch(row.creator).catch(() => null);
  if (author) {
    const dm = await author
      .send({
        embeds: [
          brandEmbed(guild, {
            title: `TU TICKET #${id} SE CERRÓ`,
            desc: `**Motivo:** ${reason}\n\nAquí abajo tienes la conversación completa. ¿Qué tal te atendimos? Valóralo con las estrellas.`,
          }),
        ],
        components: [ratingRow(guild.id, channel.id)],
      })
      .then(() => true)
      .catch(() => false);
    if (dm) await client.transcript?.(fake, author).catch(() => {});
  }

  await channel.setName(`「🔒」cerrado-${id}`).catch(() => {});
  const del = hours("deleteH");
  await channel
    .send({
      embeds: [brandEmbed(guild, { title: "TICKET CERRADO", color: COLORS.dark, desc: `${by ? `Cerrado por ${by}` : "Cerrado automáticamente"} · ${reason}${del ? `\nEl canal se borra solo en ${del} h.` : ""}` })],
      components: [
        new Discord.ActionRowBuilder().addComponents(
          new Discord.ButtonBuilder().setCustomId("Bot_transcriptTicket").setLabel("Transcripción").setEmoji("📝").setStyle(Discord.ButtonStyle.Secondary),
          new Discord.ButtonBuilder().setCustomId("Bot_openTicket").setLabel("Reabrir").setEmoji("🔓").setStyle(Discord.ButtonStyle.Primary),
          new Discord.ButtonBuilder().setCustomId("Bot_deleteTicket").setLabel("Borrar ya").setEmoji("⛔").setStyle(Discord.ButtonStyle.Danger),
        ),
      ],
    })
    .catch(() => {});
  return true;
}

async function onCloseForm(client, interaction) {
  await interaction.deferReply(ephemeral).catch(() => {});
  const ok = await closeTicket(client, interaction.guild, interaction.channel, interaction.user, interaction.fields.getTextInputValue("motivo"));
  return interaction.editReply({ content: ok ? "Ticket cerrado." : "Este ticket ya estaba cerrado." }).catch(() => {});
}

// ------------------------------------------------------------------ valoración (botones en el MD del autor)

async function onRate(client, interaction) {
  const [, guildId, channelId, n] = interaction.customId.split(":");
  const stars = Math.max(1, Math.min(5, parseInt(n) || 0));
  const info = await Info.findOne({ Guild: guildId, channelID: channelId });
  if (!info || info.creator !== interaction.user.id) return interaction.reply({ content: "No encontré ese ticket." }).catch(() => {});
  if (info.rating) return interaction.update({ components: [] }).catch(() => {});
  info.rating = stars;
  await info.save();
  await interaction.update({ components: [] }).catch(() => {});
  await interaction.followUp({ content: `¡Gracias! Valoraste la atención con ${"★".repeat(stars)}${"☆".repeat(5 - stars)}.` }).catch(() => {});
  const guild = client.guilds.cache.get(guildId);
  const config = guild && (await Tickets.findOne({ Guild: guildId }));
  const logs = config?.Logs && guild.channels.cache.get(config.Logs);
  if (logs)
    await logs
      .send({
        embeds: [
          brandEmbed(guild, {
            title: `VALORACIÓN · #${String(info.TicketID).padStart(4, "0")}`,
            color: stars >= 4 ? COLORS.ok : stars <= 2 ? COLORS.red : COLORS.warn,
            desc: `${"★".repeat(stars)}${"☆".repeat(5 - stars)} de <@${info.creator}>${info.claimedBy ? ` para <@${info.claimedBy}>` : ""}`,
          }),
        ],
      })
      .catch(() => {});
}

// ------------------------------------------------------------------ enrutado

// Devuelve true si la interacción era de los tickets nuevos
async function handle(client, interaction) {
  const id = interaction.customId || "";
  if (id.startsWith("Bot_tp_rate:")) return (await onRate(client, interaction)), true;
  if (!interaction.guild) return false;
  if (id === "Bot_ticketType" || id === "Bot_openticket") return (await onSelect(client, interaction)), true;
  if (id.startsWith("Bot_tp_form:") && interaction.isModalSubmit()) return (await onForm(client, interaction)), true;
  if (id === "Bot_tp_claim") return (await onClaim(client, interaction)), true;
  if (id === "Bot_tp_prio") return (await onPriority(client, interaction)), true;
  if (id === "Bot_tp_close" || id === "Bot_closeticket") return (await onCloseButton(client, interaction)), true;
  if (id === "Bot_tp_closeForm" && interaction.isModalSubmit()) return (await onCloseForm(client, interaction)), true;
  return false;
}

// ------------------------------------------------------------------ revisión periódica

const snowflakeTime = (id) => (id ? Number(BigInt(id) >> 22n) + 1420070400000 : 0);

async function sweep(client, now = Date.now()) {
  const remindH = hours("remindH"), closeH = hours("closeH"), deleteH = hours("deleteH");
  for (const guild of client.guilds.cache.values()) {
    const rows = await TicketChannels.find({ Guild: guild.id });
    for (const row of rows) {
      const channel = guild.channels.cache.get(row.channelID);
      if (!channel) continue;
      const info = await Info.findOne({ Guild: guild.id, channelID: row.channelID });
      if (!info) continue; // tickets del sistema viejo: no se tocan
      if (row.resolved) {
        if (deleteH && info.closedAt && now - new Date(info.closedAt).getTime() > deleteH * 3600000) {
          await channel.delete("Ticket cerrado hace tiempo").catch(() => {});
          await TicketChannels.deleteOne({ Guild: guild.id, channelID: row.channelID });
        }
        continue;
      }
      const last = Math.max(snowflakeTime(channel.lastMessageId), info.openedAt ? new Date(info.openedAt).getTime() : 0);
      const idle = (now - last) / 3600000;
      if (closeH && idle > closeH) await closeTicket(client, guild, channel, null, `Sin mensajes en ${closeH} horas`);
      else if (remindH && idle > remindH && !info.reminded) {
        info.reminded = true;
        await info.save();
        await channel
          .send({ content: `<@${row.creator}>`, embeds: [brandEmbed(guild, { color: COLORS.warn, desc: `Este ticket lleva ${remindH} horas sin mensajes. Si ya está resuelto ciérralo; si no, escribe algo o se cerrará solo.` })] })
          .catch(() => {});
      }
    }
  }
}

// ------------------------------------------------------------------ estadísticas (/tickets estadisticas)

async function stats(guildId, days = 30) {
  const since = Date.now() - days * 86400000;
  const all = (await Info.find({ Guild: guildId })).filter((t) => t.openedAt && new Date(t.openedAt).getTime() >= since);
  const open = all.filter((t) => !t.closedAt).length;
  const rated = all.filter((t) => t.rating);
  const avg = rated.length ? rated.reduce((s, t) => s + t.rating, 0) / rated.length : 0;
  const byType = {};
  for (const t of all) byType[t.type] = (byType[t.type] || 0) + 1;
  const byStaff = {};
  for (const t of all) if (t.claimedBy) byStaff[t.claimedBy] = (byStaff[t.claimedBy] || 0) + 1;
  const claimed = all.filter((t) => t.claimedAt && t.openedAt);
  const firstResponseMin = claimed.length ? claimed.reduce((s, t) => s + (new Date(t.claimedAt) - new Date(t.openedAt)), 0) / claimed.length / 60000 : 0;
  return { total: all.length, open, avg, rated: rated.length, byType, byStaff, firstResponseMin };
}

module.exports = { panel, isPanelMessage, handle, closeTicket, sweep, stats, staffRolesFrom, isStaff, controls, snowflakeTime, onForm, onSelect };
