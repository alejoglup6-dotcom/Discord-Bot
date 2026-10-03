const Discord = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");

const wl = require("../../database/whitelist");
const samp = require("../../database/samp");

/*
 * /whitelist: whitelist del servidor de SA-MP por nombre de cuenta (ver src/database/whitelist.js).
 * Rangos como en el juego (/whitelist): Operador para agregar, quitar y ver; Administrador para activar,
 * desactivar y cambiar el mensaje. Se usa la cuenta vinculada con /samp link; el dueño del Discord puede siempre.
 */
const LEVEL = { manage: 3, toggle: 4 };
const esc = (s) => Discord.escapeMarkdown(String(s));

async function staff(client, interaction, need) {
  if (interaction.guild?.ownerId === interaction.user.id) return interaction.user.username;
  const me = await samp.getLinkedPlayer(interaction.user.id);
  if (!me) {
    client.errNormal({ error: "Primero vincula tu cuenta del servidor con /samp link", type: "editreply" }, interaction);
    return null;
  }
  if (me.admin_level < need) {
    client.errNormal({ error: `Necesitas el rango ${samp.ADMIN_LEVELS[need]} o superior en el servidor`, type: "editreply" }, interaction);
    return null;
  }
  return me.name;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Whitelist del servidor de juego (quién puede entrar)")
    .addSubcommand((s) => s.setName("estado").setDescription("Si está activada, cuántos hay en la lista y el mensaje"))
    .addSubcommand((s) =>
      s
        .setName("agregar")
        .setDescription("Agrega nombres de cuenta a la whitelist (Operador)")
        .addStringOption((o) => o.setName("nombres").setDescription("Nombre_Apellido; varios separados por espacio o coma").setRequired(true).setMaxLength(1000)),
    )
    .addSubcommand((s) =>
      s
        .setName("quitar")
        .setDescription("Quita un nombre de la whitelist (Operador)")
        .addStringOption((o) => o.setName("nombre").setDescription("Nombre_Apellido").setRequired(true).setMaxLength(24)),
    )
    .addSubcommand((s) => s.setName("lista").setDescription("Nombres que hay en la whitelist (Operador)"))
    .addSubcommand((s) => s.setName("activar").setDescription("Solo entran los de la lista y el staff (Administrador)"))
    .addSubcommand((s) => s.setName("desactivar").setDescription("Puede entrar cualquiera (Administrador)"))
    .addSubcommand((s) =>
      s
        .setName("mensaje")
        .setDescription("Mensaje que ve en el juego quien no está en la lista (Administrador)")
        .addStringOption((o) => o.setName("texto").setDescription("Usa | para saltar de línea. Sin acentos (el juego no los muestra bien)").setRequired(true).setMinLength(5).setMaxLength(255)),
    ),

  /**
   * @param {Discord.Client} client
   * @param {Discord.ChatInputCommandInteraction} interaction
   */
  run: async (client, interaction) => {
    await interaction.deferReply({ withResponse: true });
    if (!(await client.samp.available(interaction))) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "estado") {
      const c = await wl.getConfig();
      return client.embed(
        {
          title: "📋・Whitelist del servidor",
          desc:
            `Estado: **${c.enabled ? "🟢 ACTIVADA" : "🔴 DESACTIVADA"}**\n` +
            (c.enabled ? "Solo pueden entrar los nombres de la lista y el staff." : "Puede entrar cualquiera.") +
            `\nEn la lista: **${c.total}** nombres`,
          fields: [{ name: "Mensaje para quien no está en la lista", value: esc(c.message.replace(/\|/g, "\n")).slice(0, 1000) }],
          type: "editreply",
        },
        interaction,
      );
    }

    const need = ["activar", "desactivar", "mensaje"].includes(sub) ? LEVEL.toggle : LEVEL.manage;
    const by = await staff(client, interaction, need);
    if (!by) return;

    if (sub === "agregar") {
      const { valid, invalid } = wl.parseNames(interaction.options.getString("nombres"));
      if (!valid.length) return client.errNormal({ error: "Escribe nombres de cuenta válidos, por ejemplo Juan_Perez", type: "editreply" }, interaction);
      const r = await wl.add(valid, by);
      const lines = [];
      if (r.added.length) lines.push(`✅ Agregados (${r.added.length}): ${r.added.map((n) => `**${esc(n)}**`).join(", ")}`);
      if (r.already.length) lines.push(`ℹ️ Ya estaban: ${r.already.map(esc).join(", ")}`);
      if (invalid.length) lines.push(`⚠️ Nombres no válidos (no se agregaron): ${invalid.map(esc).join(", ")}`);
      return client.succNormal({ text: lines.join("\n"), type: "editreply" }, interaction);
    }
    if (sub === "quitar") {
      const name = interaction.options.getString("nombre").trim();
      if (!(await wl.remove(name))) return client.errNormal({ error: `${name} no está en la whitelist`, type: "editreply" }, interaction);
      return client.succNormal({ text: `**${esc(name)}** ya no está en la whitelist`, type: "editreply" }, interaction);
    }
    if (sub === "lista") {
      const rows = await wl.list(200);
      const c = await wl.getConfig();
      const text = rows.length ? rows.map((r) => `\`${r.name}\``).join(" · ") : "La lista está vacía. Agrega nombres con `/whitelist agregar`.";
      return client.embed(
        {
          title: `📋・Whitelist (${c.total}) · ${c.enabled ? "🟢 activada" : "🔴 desactivada"}`,
          desc: text.length > 4000 ? text.slice(0, 3990) + " …" : text,
          type: "editreply",
        },
        interaction,
      );
    }
    if (sub === "activar" || sub === "desactivar") {
      const on = sub === "activar";
      await wl.setEnabled(on, by);
      const c = await wl.getConfig();
      return client.succNormal(
        {
          text: on
            ? `Whitelist **ACTIVADA**. Solo entran los **${c.total}** nombres de la lista y el staff. Los que ya están conectados siguen jugando.`
            : "Whitelist **DESACTIVADA**. Ya puede entrar cualquiera.",
          type: "editreply",
        },
        interaction,
      );
    }
    if (sub === "mensaje") {
      const text = interaction.options.getString("texto").trim();
      await wl.setMessage(text, by);
      return client.succNormal({ text: `Mensaje cambiado:\n>>> ${esc(text.replace(/\|/g, "\n"))}`, type: "editreply" }, interaction);
    }
  },
};
