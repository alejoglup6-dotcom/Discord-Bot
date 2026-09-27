const Discord = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");

const store = require("../../database/serverBackup");
const engine = require("../../assets/utils/serverBackup");

/*
 * /backup: copias de seguridad de TODO el servidor (ver src/assets/utils/serverBackup.js).
 * - crear, lista, info: administradores.
 * - restaurar, descargar: solo el dueño del servidor o las cuentas de BACKUP_OWNERS (IDs separados por comas),
 *   porque restaurar cambia todo el servidor y la descarga lleva todos los mensajes.
 */
const mb = (n) => (Number(n) / 1024 / 1024).toFixed(Number(n) < 10 * 1024 * 1024 ? 2 : 1) + " MB";
const when = (d) => (d ? `<t:${Math.floor(d.getTime() / 1000)}:f>` : "—");
const owners = () => String(process.env.BACKUP_OWNERS || "").split(/[\s,]+/).filter(Boolean);
const isOwner = (interaction) => interaction.guild.ownerId === interaction.user.id || owners().includes(interaction.user.id);
const isAdmin = (interaction) => isOwner(interaction) || interaction.member?.permissions?.has(Discord.PermissionFlagsBits.Administrator);

function statsLine(s) {
  return [
    `${s.channels ?? 0} canales`,
    `${s.threads ?? 0} hilos`,
    `${s.roles ?? 0} roles`,
    `${s.members ?? 0} miembros`,
    `${s.emojis ?? 0} emojis`,
    `${s.stickers ?? 0} stickers`,
    `${s.bans ?? 0} baneos`,
  ].join(" · ");
}

// Mensajes que no caben en la respuesta (la respuesta caduca a los 15 minutos): por MD
async function tell(interaction, payload) {
  const ok = await interaction.editReply(payload).then(() => true).catch(() => false);
  if (!ok) await interaction.user.send(payload).catch(() => {});
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("backup")
    .setDescription("Copias de seguridad de todo el servidor (se hace una sola cada 12 horas)")
    .addSubcommand((s) => s.setName("crear").setDescription("Hace una copia ahora: ajustes, roles, canales, permisos, miembros y mensajes"))
    .addSubcommand((s) => s.setName("lista").setDescription("Últimas copias guardadas"))
    .addSubcommand((s) => s.setName("info").setDescription("Qué hay guardado y cuánto ocupa"))
    .addSubcommand((s) =>
      s
        .setName("restaurar")
        .setDescription("Deja el servidor como estaba en una copia (solo el dueño)")
        .addIntegerOption((o) => o.setName("id").setDescription("Número de la copia (/backup lista). Sin poner: la última").setMinValue(1))
        .addBooleanOption((o) => o.setName("mensajes").setDescription("Volver a publicar los mensajes de los canales borrados (sí por defecto)"))
        .addBooleanOption((o) => o.setName("borrar_extra").setDescription("Borrar canales y roles que no estaban en la copia (no por defecto)"))
        .addBooleanOption((o) => o.setName("baneos").setDescription("Dejar la lista de baneos como estaba (no por defecto)"))
        .addStringOption((o) => o.setName("servidor").setDescription("ID del servidor de la copia, para restaurar en un servidor nuevo").setMaxLength(20))
        .addAttachmentOption((o) => o.setName("archivo").setDescription("Archivo .json.gz de /backup descargar (si se perdió la base de datos)")),
    )
    .addSubcommand((s) =>
      s
        .setName("descargar")
        .setDescription("Te manda por MD un archivo con la copia, para guardarla fuera (solo el dueño)")
        .addIntegerOption((o) => o.setName("id").setDescription("Número de la copia. Sin poner: la última").setMinValue(1)),
    ),

  /**
   * @param {Discord.Client} client
   * @param {Discord.ChatInputCommandInteraction} interaction
   */
  run: async (client, interaction) => {
    await interaction.deferReply({ withResponse: true });
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const fail = (error) => client.errNormal({ error, type: "editreply" }, interaction);

    if (["restaurar", "descargar"].includes(sub) ? !isOwner(interaction) : !isAdmin(interaction)) {
      return fail(["restaurar", "descargar"].includes(sub) ? "Solo el dueño del servidor puede usar esto" : "Necesitas el permiso de Administrador");
    }
    try {
      await store.init();
    } catch (err) {
      return fail(`No hay conexión con la base de datos: ${err.message}`);
    }

    // ------------------------------------------------------------ crear
    if (sub === "crear") {
      await interaction.editReply({ embeds: [client.templateEmbed().setTitle("💾・Haciendo la copia…").setDescription("Guardando ajustes, roles, canales, miembros y mensajes. Puede tardar unos minutos la primera vez.")] });
      let lastEdit = 0;
      const log = (r) => {
        if (Date.now() - lastEdit < 5000) return;
        lastEdit = Date.now();
        interaction
          .editReply({ embeds: [client.templateEmbed().setTitle("💾・Haciendo la copia…").setDescription(`Canales revisados: **${r.channels}**\nMensajes nuevos: **${r.messages}**\nArchivos: **${r.files}** (${mb(r.fileBytes)})`)] })
          .catch(() => {});
      };
      const started = Date.now();
      let r;
      try {
        r = await engine.createBackup(client.rest, guild.id, { kind: "manual", by: interaction.user.id, log });
      } catch (err) {
        return tell(interaction, { embeds: [client.templateEmbed().setTitle("❌・No se pudo hacer la copia").setColor(client.config.colors.error).setDescription(err.message)] });
      }
      const t = await store.totals(guild.id);
      const embed = client
        .templateEmbed()
        .setTitle(`💾・Copia #${r.id} guardada`)
        .setColor(client.config.colors.succes)
        .setDescription(statsLine(r.stats))
        .addFields(
          { name: "Esta copia", value: `${r.messages.messages} mensajes nuevos · ${r.messages.files} archivos nuevos · estructura ${mb(r.size)} · ${Math.round((Date.now() - started) / 1000)} s` },
          { name: "Guardado en total", value: `${t.messages} mensajes (${mb(t.messageBytes)}) · ${t.files} archivos (${mb(t.fileBytes)}) · ${t.backups} copias (${mb(t.backupBytes)})` },
        );
      if (r.messages.skippedFiles) embed.addFields({ name: "Archivos sin guardar", value: `${r.messages.skippedFiles} (más grandes que ${process.env.BACKUP_MAX_FILE_MB || 8} MB o ya borrados)` });
      if (r.messages.failedChannels.length) embed.addFields({ name: "Canales que el bot no puede leer", value: r.messages.failedChannels.slice(0, 10).join("\n").slice(0, 1000) });
      return tell(interaction, { embeds: [embed] });
    }

    // ------------------------------------------------------------ lista
    if (sub === "lista") {
      const rows = await store.listBackups(guild.id, 15);
      if (!rows.length) return fail("Todavía no hay copias. Haz una con /backup crear");
      const lines = rows.map((b) => `**#${b.id}** · ${b.kind === "auto" ? "🕒 automática" : `👤 <@${b.created_by}>`} · ${when(b.created_at)} · ${b.stats.channels ?? 0} canales, ${b.stats.members ?? 0} miembros, +${b.stats.new_messages ?? 0} mensajes`);
      return interaction.editReply({ embeds: [client.templateEmbed().setTitle("💾・Copias de seguridad").setDescription(lines.join("\n")).setFooter({ text: "Restaurar: /backup restaurar id:<número> · Se hace una automática cada 12 horas" })] });
    }

    // ------------------------------------------------------------ info
    if (sub === "info") {
      const t = await store.totals(guild.id);
      const [last] = await store.listBackups(guild.id, 1);
      const next = await store.lastBackupDate(guild.id, "auto");
      const hours = parseFloat(process.env.BACKUP_INTERVAL_HOURS) || 12;
      return interaction.editReply({
        embeds: [
          client
            .templateEmbed()
            .setTitle("💾・Copias de seguridad")
            .setDescription("Se guardan en la base de datos del servidor de juego, fuera de Discord: aunque borren canales, roles o el servidor entero, las copias siguen a salvo.")
            .addFields(
              { name: "Última copia", value: last ? `#${last.id} · ${when(last.created_at)}\n${statsLine(last.stats)}` : "Ninguna" },
              { name: "Próxima automática", value: String(process.env.BACKUP_ENABLED).toLowerCase() === "false" ? "Apagadas (BACKUP_ENABLED=false)" : next ? when(new Date(next.getTime() + hours * 3600000)) : "En unos minutos" },
              { name: "Mensajes", value: `${t.messages} de ${t.channels} canales · ${mb(t.messageBytes)}`, inline: true },
              { name: "Archivos", value: `${t.files} · ${mb(t.fileBytes)}`, inline: true },
              { name: "Copias", value: `${t.backups} · ${mb(t.backupBytes)}`, inline: true },
              { name: "Total", value: mb(t.messageBytes + t.fileBytes + t.backupBytes), inline: true },
            ),
        ],
      });
    }

    // ------------------------------------------------------------ descargar
    if (sub === "descargar") {
      const backup = await store.getBackup(guild.id, interaction.options.getInteger("id"));
      if (!backup) return fail("No existe esa copia");
      const { buffer, withMessages } = await engine.exportBackup(backup);
      const name = `backup-${guild.id}-${backup.id}.json.gz`;
      const sent = await interaction.user
        .send({
          content:
            `💾 Copia **#${backup.id}** de **${guild.name}** (${when(backup.created_at)}), ${mb(buffer.length)}.\n` +
            (withMessages ? "Lleva la estructura y el texto de todos los mensajes." : "Lleva la estructura (roles, canales, permisos, miembros…). Los mensajes no caben en un archivo de Discord: siguen en la base de datos.") +
            "\nGuárdala fuera de Discord. Para usarla: `/backup restaurar archivo:` con este archivo.",
          files: [new Discord.AttachmentBuilder(buffer, { name })],
        })
        .then(() => true)
        .catch(() => false);
      return sent
        ? client.succNormal({ text: "Te mandé la copia por mensaje directo", type: "editreply" }, interaction)
        : fail("No te puedo mandar mensajes directos: actívalos en los ajustes de privacidad del servidor");
    }

    // ------------------------------------------------------------ restaurar
    let snapshot;
    let source;
    let label;
    const file = interaction.options.getAttachment("archivo");
    const from = interaction.options.getString("servidor") || guild.id;
    if (file) {
      if (file.size > 25 * 1024 * 1024) return fail("El archivo es demasiado grande");
      try {
        const res = await fetch(file.url);
        ({ snapshot, source } = engine.importBackup(Buffer.from(await res.arrayBuffer())));
      } catch (err) {
        return fail(err.message);
      }
      label = `el archivo \`${file.name}\``;
    } else {
      if (!/^\d{17,20}$/.test(from)) return fail("El ID del servidor no es válido");
      const backup = await store.getBackup(from, interaction.options.getInteger("id"));
      if (!backup) return fail("No existe esa copia");
      snapshot = backup.snapshot;
      label = `la copia **#${backup.id}** (${when(backup.created_at)})`;
    }
    // Una copia de OTRO servidor solo la puede usar quien era dueño de ese servidor (o BACKUP_OWNERS)
    if (snapshot.guild.id !== guild.id && snapshot.guild.owner_id !== interaction.user.id && !owners().includes(interaction.user.id)) {
      return fail("Esa copia es de otro servidor y no eras su dueño");
    }

    const opts = {
      messages: interaction.options.getBoolean("mensajes") ?? true,
      deleteExtra: interaction.options.getBoolean("borrar_extra") ?? false,
      bans: interaction.options.getBoolean("baneos") ?? false,
    };
    const row = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder().setCustomId("backup_restore_yes").setLabel("Restaurar").setStyle(Discord.ButtonStyle.Danger),
      new Discord.ButtonBuilder().setCustomId("backup_restore_no").setLabel("Cancelar").setStyle(Discord.ButtonStyle.Secondary),
    );
    const msg = await interaction.editReply({
      embeds: [
        client
          .templateEmbed()
          .setTitle("⚠️・¿Restaurar el servidor?")
          .setColor("#e8392f")
          .setDescription(
            `Se va a dejar **${guild.name}** como estaba en ${label}:\n${statsLine(snapshot.stats || {})}\n\n` +
              "• Se crean los roles, canales, emojis y stickers que falten, con sus permisos y en su lugar.\n" +
              "• Los roles y canales que siguen existiendo vuelven a su nombre, permisos y categoría.\n" +
              "• Se reponen los ajustes, el ícono y los roles de los miembros que siguen en el servidor.\n" +
              (opts.messages ? "• Se vuelven a publicar los mensajes de los canales que haya que crear de nuevo.\n" : "") +
              (opts.deleteExtra ? "• **Se BORRAN los canales y roles que no estaban en la copia.**\n" : "") +
              (opts.bans ? "• La lista de baneos queda como estaba (se quitan los baneos nuevos).\n" : "") +
              "\nEl progreso y el resultado te llegan por mensaje directo.",
          ),
      ],
      components: [row],
    });
    const click = await msg.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, time: 60000 }).catch(() => null);
    if (!click || click.customId !== "backup_restore_yes") {
      if (click) await click.deferUpdate().catch(() => {});
      return interaction.editReply({ embeds: [client.templateEmbed().setTitle("Restauración cancelada").setDescription("No se cambió nada.")], components: [] }).catch(() => {});
    }
    await click.update({ embeds: [client.templateEmbed().setTitle("♻️・Restaurando…").setDescription("Te voy contando por mensaje directo.")], components: [] }).catch(() => {});

    const dm = async (text) => interaction.user.send(text.slice(0, 2000)).catch(() => {});
    await dm(`♻️ Empiezo a restaurar **${guild.name}** desde ${label}.`);
    let result;
    try {
      result = await engine.restoreBackup(client.rest, guild.id, snapshot, { ...opts, source, log: (t) => dm(`… ${t}`) });
    } catch (err) {
      return dm(`❌ La restauración se detuvo: ${err.message}`);
    }
    const r = result.report;
    const text =
      `✅ Restauración de **${guild.name}** terminada.\n` +
      `Roles: ${r.rolesCreated} creados, ${r.rolesUpdated} corregidos · Canales: ${r.channelsCreated} creados, ${r.channelsUpdated} corregidos\n` +
      `Emojis: ${r.emojis} · Stickers: ${r.stickers} · Roles devueltos a miembros: ${r.memberRoles} · Mensajes publicados: ${r.messages}` +
      (opts.deleteExtra ? ` · Borrados: ${r.deleted}` : "") +
      (opts.bans ? ` · Baneos: +${r.bans} / -${r.unbans}` : "") +
      (r.errors.length ? `\n\n⚠️ ${r.errors.length} cosas no se pudieron restaurar:\n${r.errors.slice(0, 15).join("\n")}` : "");
    await dm(text);
    await interaction.editReply({ embeds: [client.templateEmbed().setTitle("✅・Servidor restaurado").setDescription(text.slice(0, 4000))] }).catch(() => {});
  },
};
