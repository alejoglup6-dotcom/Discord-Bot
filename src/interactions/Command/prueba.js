const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const moment = require("moment-timezone");

const { sendWelcome, sendLeave } = require("../../assets/utils/welcome");
const fortuna = require("../../database/fortuna");
const catalog = require("../../assets/data/fortuna");
const prizes = require("../../handlers/functions/fortunaPrizes");
const { textChannel, roleByName } = require("../../assets/utils/guildLookup");

// Pruebas para el staff: ver que la bienvenida, la despedida, los contadores, las tablas y los premios funcionan
module.exports = {
  data: new SlashCommandBuilder()
    .setName("prueba")
    .setDescription("Prueba los sistemas del servidor (administradores)")
    .addSubcommand((s) =>
      s
        .setName("bienvenida")
        .setDescription("Envía un mensaje de bienvenida de prueba al canal de bienvenidas")
        .addUserOption((o) => o.setName("usuario").setDescription("A quién usar de ejemplo (por defecto tú)").setRequired(false)),
    )
    .addSubcommand((s) =>
      s
        .setName("despedida")
        .setDescription("Envía un mensaje de despedida de prueba al canal de despedidas")
        .addUserOption((o) => o.setName("usuario").setDescription("A quién usar de ejemplo (por defecto tú)").setRequired(false)),
    )
    .addSubcommand((s) => s.setName("contadores").setDescription("Actualiza ya los contadores de estadísticas"))
    .addSubcommand((s) => s.setName("tablas").setDescription("Actualiza ya las tablas de invitados y millonarios"))
    .addSubcommand((s) => s.setName("premios").setDescription("Muestra el próximo reparto de la Fortuna y quién ganaría hoy")),

  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    const guild = interaction.guild;
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return client.errNormal({ error: "Solo los administradores pueden usar /prueba", type: "editreply" }, interaction);

    const sub = interaction.options.getSubcommand();
    const ok = (title, desc) => client.embed({ title: `🧪・${title}`, desc, type: "editreply" }, interaction);

    if (sub === "bienvenida" || sub === "despedida") {
      const member = interaction.options.getMember("usuario") || interaction.member;
      const r = sub === "bienvenida" ? await sendWelcome(client, member, { test: true }) : await sendLeave(client, member, { test: true });
      const kind = sub === "bienvenida" ? "bienvenidas" : "despedidas";
      if (!r.channel)
        return client.errNormal(
          { error: `No encontré el canal de ${kind}: tiene que haber un canal que se llame "${kind}" (o configurarlo con /configurar)`, type: "editreply" },
          interaction,
        );
      if (!r.message)
        return client.errNormal(
          { error: `Discord no aceptó el mensaje en #${r.channel.name}. Revisa que el bot pueda ver el canal, enviar mensajes, insertar enlaces y adjuntar archivos`, type: "editreply" },
          interaction,
        );
      return ok(
        sub === "bienvenida" ? "Bienvenida enviada" : "Despedida enviada",
        `✅ Mensaje de prueba en ${r.channel}: [ver mensaje](${r.message.url})\n` +
          (r.card ? "🖼️ La tarjeta con la foto se generó bien." : "⚠️ Sin tarjeta: la librería de imágenes (canvas) no funciona en el hosting; el resto del mensaje sí."),
      );
    }

    if (sub === "contadores") {
      if (!client.refreshStats) return client.errNormal({ error: "Los contadores no están cargados", type: "editreply" }, interaction);
      const results = await client.refreshStats(guild);
      if (!results.length)
        return client.errNormal({ error: 'No encontré contadores: tiene que haber una categoría "Estadísticas" con canales como "👤 Miembros: 0"', type: "editreply" }, interaction);
      const icon = { same: "✅ al día", wait: "⏳ en espera (Discord solo deja renombrar cada 5 min)", missing: "❌ el canal ya no existe" };
      const lines = results.map((r) =>
        r.done && r.reason !== "same" ? `✏️ ${r.from} → **${r.to}**` : `${r.to || r.field} · ${icon[r.reason] || `❌ ${r.reason}`}`,
      );
      return ok("Contadores", lines.join("\n"));
    }

    if (sub === "tablas") {
      if (!client.updateLiveBoards) return client.errNormal({ error: "Las tablas no están cargadas", type: "editreply" }, interaction);
      const done = await client.updateLiveBoards(guild);
      if (!done.length)
        return client.errNormal({ error: 'No encontré los canales "invitados" ni "millonarios" (o no hay conexión con la base de datos del juego)', type: "editreply" }, interaction);
      return ok("Tablas actualizadas", done.map((c) => `✅ ${c}`).join("\n"));
    }

    if (sub === "premios") {
      const tz = process.env.FORTUNA_TZ || "America/Mexico_City";
      const next = moment.tz(prizes.lastPrizeKey(), tz).add(7, "days").hour(catalog.PRIZE_HOUR);
      const top = await fortuna.leaderboard(guild.id, 3);
      const channel = textChannel(guild, /^fortuna$/);
      const role = roleByName(guild, catalog.MAGNATE_ROLE);
      const lines = top.map((u, i) => `${["🥇", "🥈", "🥉"][i]} <@${u.user}> · ${catalog.money(u.total)} → ganaría ${catalog.money(catalog.WEEKLY_PRIZES[i])}`);
      return ok(
        "Premios de la Fortuna",
        `📅 Próximo reparto: <t:${next.unix()}:F> (<t:${next.unix()}:R>)\n` +
          `${channel ? "✅" : "❌"} Canal de anuncio: ${channel || 'falta un canal "fortuna"'}\n` +
          `${role ? "✅" : "❌"} Rol: ${role || `falta el rol "${catalog.MAGNATE_ROLE}"`}\n\n` +
          `**Si fuera hoy:**\n${lines.join("\n") || "Nadie tiene fortuna todavía."}\n\n*Esto es solo una vista: no se paga nada.*`,
      );
    }
  },
};
