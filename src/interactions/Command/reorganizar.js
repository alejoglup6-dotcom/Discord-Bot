const Discord = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");

const layout = require("../../assets/utils/serverLayout");
const backup = require("../../assets/utils/serverBackup");
const store = require("../../database/serverBackup");

/*
 * /reorganizar: reorganiza el Discord según el plano (src/assets/data/serverLayout.js).
 * - vista: lista lo que cambiaría, sin tocar nada.
 * - aplicar: hace antes una copia con /backup (salvo copia:false) y aplica el plano: categorías, nombres, orden,
 *   permisos (solo verificados ven el servidor), canales nuevos y mensajes nuevos (normas, verificación, tickets...).
 * Solo el dueño del servidor o las cuentas de BACKUP_OWNERS.
 */
const owners = () => String(process.env.BACKUP_OWNERS || "").split(/[\s,]+/).filter(Boolean);
const isOwner = (i) => i.guild.ownerId === i.user.id || owners().includes(i.user.id);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reorganizar")
    .setDescription("Reorganiza el Discord de SampCity (solo el dueño)")
    .addSubcommand((s) => s.setName("vista").setDescription("Muestra lo que cambiaría la reorganización, sin tocar nada"))
    .addSubcommand((s) =>
      s
        .setName("aplicar")
        .setDescription("Aplica la reorganización: categorías, nombres, permisos y mensajes nuevos")
        .addBooleanOption((o) => o.setName("limpiar_mensajes").setDescription("Borrar los mensajes viejos de normas, verificación, soporte y guía (por defecto sí)"))
        .addBooleanOption((o) => o.setName("copia").setDescription("Hacer antes una copia de seguridad (por defecto sí)")),
    ),

  run: async (client, interaction) => {
    if (!isOwner(interaction))
      return client.errNormal({ error: "Solo el dueño del servidor puede reorganizarlo", type: "editreply" }, interaction);
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const file = (lines, name) => new Discord.AttachmentBuilder(Buffer.from(lines.map((l) => `• ${l}`).join("\n") || "Nada que cambiar."), { name });
    const tell = async (payload) => {
      const ok = await interaction.editReply(payload).then(() => true).catch(() => false);
      if (!ok) await interaction.user.send(payload).catch(() => {});
    };

    if (sub === "vista") {
      const lines = await layout.organize(client, guild, { dry: true, cleanMessages: true });
      return tell({
        content: `Esto es lo que haría **/reorganizar aplicar** (${lines.length} cambios). Nada se ha tocado todavía.`,
        files: [file(lines, "reorganizacion-vista.txt")],
      });
    }

    const clean = interaction.options.getBoolean("limpiar_mensajes") ?? true;
    const withBackup = interaction.options.getBoolean("copia") ?? true;
    await tell({ content: withBackup ? "Haciendo una copia de seguridad antes de cambiar nada…" : "Reorganizando…" });
    if (withBackup) {
      try {
        await store.init();
        await backup.createBackup(client.rest, guild.id, { kind: "manual", by: interaction.user.id });
      } catch (e) {
        return tell({ content: `No pude hacer la copia (${e.message}), así que no he cambiado nada. Si quieres seguir sin copia usa copia:false.` });
      }
      await tell({ content: "Copia hecha. Reorganizando…" });
    }
    let lines;
    try {
      lines = await layout.organize(client, guild, { dry: false, cleanMessages: clean });
    } catch (e) {
      return tell({ content: `La reorganización se paró: ${e.message}. Lo que ya cambió se puede deshacer con /backup restaurar.` });
    }
    const errors = lines.filter((l) => l.includes("⚠️")).length;
    return tell({
      content:
        `Listo: ${lines.length - errors} cambios${errors ? `, ${errors} con error (mira el archivo)` : ""}.` +
        (withBackup ? " Si algo no te gusta, /backup restaurar deja el servidor como estaba." : ""),
      files: [file(lines, "reorganizacion.txt")],
    });
  },
};
