const tiktokCreators = require("../../database/models/tiktokCreators");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const tools = client.tiktokTools;
  const rows = await tiktokCreators.find({ Guild: interaction.guild.id }).lean();
  rows.sort((a, b) => (a.Date || 0) - (b.Date || 0));

  const lines = [
    ...(tools ? tools.envCreators : []).map((c) => `• [@${c}](https://www.tiktok.com/@${c}) _(fijo en .env)_`),
    ...rows.map((r) => {
      const extra = [r.Member ? `<@${r.Member}>` : null, r.AddedBy ? `agregado por <@${r.AddedBy}>` : null, r.Date ? `<t:${Math.floor(r.Date / 1000)}:d>` : null].filter(Boolean);
      return `• [@${r.User}](https://www.tiktok.com/@${r.User})${extra.length ? ` · ${extra.join(" · ")}` : ""}`;
    }),
  ];

  return client.embed(
    {
      title: `🎵・Creadores de TikTok (${lines.length})`,
      desc: lines.length
        ? `Se avisan los videos de estos creadores que mencionen a **@${tools?.mainUser}**:\n\n${lines.join("\n")}`.slice(0, 4000)
        : "Todavía no hay creadores. Agrega uno con `/tiktok add`.",
      type: "editreply",
    },
    interaction,
  );
};
