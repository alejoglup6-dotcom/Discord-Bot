const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const layout = require("../../assets/utils/serverLayout");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("montar")
    .setDescription("Organiza el servidor: canales, bienvenida, contadores, invitaciones y Fortuna (administradores)")
    .addStringOption((option) =>
      option
        .setName("modo")
        .setDescription("Primero mira la vista previa; después aplica")
        .setRequired(false)
        .addChoices({ name: "Vista previa (no cambia nada)", value: "preview" }, { name: "Aplicar los cambios", value: "apply" }),
    ),

  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    const guild = interaction.guild;

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
      return client.errNormal({ error: "Solo los administradores pueden usar /montar", type: "editreply" }, interaction);

    const me = guild.members.me;
    const missing = [
      [PermissionFlagsBits.ManageChannels, "Gestionar canales"],
      [PermissionFlagsBits.ManageRoles, "Gestionar roles"],
    ].filter(([perm]) => !me.permissions.has(perm));
    if (missing.length)
      return client.errNormal({ error: `Al bot le falta el permiso: ${missing.map(([, n]) => n).join(", ")}`, type: "editreply" }, interaction);

    const mode = interaction.options.getString("modo") || "preview";

    if (mode !== "apply") {
      const p = await layout.plan(guild);
      const text = layout.describe(p);
      return client.embed(
        {
          title: "🧭・Vista previa del montaje",
          desc: (text.length > 3900 ? text.slice(0, 3900) + "\n…" : text) + "\n\nSi te parece bien: `/montar modo:aplicar` o `!montar aplicar`. No se borra nada.",
          type: "editreply",
        },
        interaction,
      );
    }

    const { report, leftEmpty } = await layout.apply(client, guild);
    const list = (arr) => (arr.length ? arr.join("\n").slice(0, 1000) : "—");
    const fields = [
      { name: "➕┆Creado", value: list(report.created), inline: true },
      { name: "➡️┆Movido", value: list(report.moved), inline: true },
      { name: "✏️┆Categorías renombradas", value: list(report.renamed) },
      { name: "🎭┆Roles nuevos", value: list(report.roles) },
    ];
    if (leftEmpty.length) fields.push({ name: "🗑️┆Categorías vacías (bórralas si quieres)", value: list(leftEmpty.map((c) => c.name)) });
    if (report.errors.length) fields.push({ name: "⚠️┆No se pudo", value: list(report.errors) });
    fields.push({
      name: "✅┆Listo",
      value:
        "Bienvenida y despedida con tarjeta, contadores, recompensas por invitación y la Fortuna quedaron configurados. " +
        "Si algún rol nuevo no se puede dar, sube el rol del bot por encima de ellos en Ajustes → Roles.",
    });
    client.embed({ title: "🧭・Servidor montado", fields, type: "editreply" }, interaction);
  },
};
