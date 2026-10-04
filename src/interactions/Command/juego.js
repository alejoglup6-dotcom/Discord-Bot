const { SlashCommandBuilder } = require("discord.js");
const { COMMANDS } = require("../../assets/data/juego");

// /juego: comandos del juego para el Fundador (src/assets/data/juego.js y src/assets/utils/juego.js)
const data = new SlashCommandBuilder().setName("juego").setDescription("Comandos del juego desde Discord (solo Fundador)");
data.addSubcommand((s) => s.setName("help").setDescription("Lista de comandos del juego que se pueden usar desde aquí"));
for (const c of COMMANDS) {
  data.addSubcommand((s) => {
    s.setName(c.sub).setDescription(c.desc.slice(0, 100));
    if (!c.noTarget) {
      s.addStringOption((o) => o.setName("name").setDescription("Nombre de la cuenta en el juego (Nombre_Apellido)").setRequired(true).setMaxLength(24));
    }
    for (const opt of c.opts) {
      if (opt.type === "string") {
        s.addStringOption((o) => o.setName(opt.name).setDescription(opt.desc).setRequired(true).setMaxLength(opt.maxLength || 100));
      } else {
        s.addIntegerOption((o) => {
          o.setName(opt.name).setDescription(opt.desc).setRequired(true);
          if (opt.choices) o.addChoices(...opt.choices);
          if (opt.min !== undefined) o.setMinValue(opt.min);
          if (opt.max !== undefined) o.setMaxValue(opt.max);
          return o;
        });
      }
    }
    return s;
  });
}

module.exports = {
  data,
  run: async (client, interaction) => {
    await interaction.deferReply({ flags: require("discord.js").MessageFlags.Ephemeral });
    if (!(await client.samp.available(interaction))) return;
    return require("../../assets/utils/juego").run(client, interaction);
  },
};
