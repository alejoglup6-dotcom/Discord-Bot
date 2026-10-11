const { escapeMarkdown: md } = require("discord.js");
const tiktokCreators = require("../../database/models/tiktokCreators");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const tools = client.tiktokTools;
  let rows;
  try {
    rows = await tiktokCreators.find({ Guild: interaction.guild.id }).lean();
  } catch (e) {
    console.log(`[tiktok] lista: ${e.message}`);
    return client.errNormal({ error: "No pude leer la lista de creadores ahora. Prueba de nuevo en un rato.", type: "editreply" }, interaction);
  }
  rows = (rows || []).filter((r) => r && r.User);
  rows.sort((a, b) => (Number(a.Date) || 0) - (Number(b.Date) || 0));

  // El nombre va escapado: con "_" Discord lo pondría en cursiva (@juan_becker_ salía como @juanbecker)
  const link = (u) => `[@${md(u)}](https://www.tiktok.com/@${u})`;
  const lines = [
    ...(tools ? tools.envCreators : []).map((c) => `• ${link(c)} *(fijo en .env)*`),
    ...rows.map((r) => {
      const date = Number(r.Date) || 0;
      const extra = [r.Member ? `<@${r.Member}>` : null, r.AddedBy ? `agregado por <@${r.AddedBy}>` : null, date ? `<t:${Math.floor(date / 1000)}:d>` : null].filter(Boolean);
      return `• ${link(r.User)}${extra.length ? ` · ${extra.join(" · ")}` : ""}`;
    }),
  ];

  // La descripción de un embed admite 4096 caracteres: se corta por líneas enteras
  let desc = `Se avisan los videos de estos creadores que mencionen a **@${md(tools ? tools.mainUser : "")}**:\n`;
  let shown = 0;
  for (const l of lines) {
    if (desc.length + l.length + 40 > 4000) break;
    desc += `\n${l}`;
    shown++;
  }
  if (shown < lines.length) desc += `\n… y ${lines.length - shown} más`;

  return client.embed(
    {
      title: `🎵・Creadores de TikTok (${lines.length})`,
      desc: lines.length ? desc : "Todavía no hay creadores. Agrega uno con `/tiktok add`.",
      type: "editreply",
    },
    interaction,
  );
};
