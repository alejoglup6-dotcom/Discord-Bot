const { SlashCommandBuilder } = require("discord.js");
const { COMMANDS } = require("../../assets/data/juego");

// /juego: comandos del juego para el Fundador (src/assets/data/juego.js y src/assets/utils/juego.js)
const data = new SlashCommandBuilder().setName("juego").setDescription("Comandos del juego desde Discord (solo Fundador)");
data.addSubcommand((s) => s.setName("help").setDescription("Lista de comandos del juego que se pueden usar desde aquí"));
for (const c of COMMANDS) {
  data.addSubcommand((s) => {
    s.setName(c.sub).setDescription(c.desc.slice(0, 100));
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
    // Discord exige las obligatorias primero: el jugador (nombre o @) va al final; hay que poner uno de los dos
    if (!c.noTarget) {
      s.addStringOption((o) => o.setName("name").setDescription("Jugador por nombre de cuenta (Nombre_Apellido) o usa 'usuario'").setMaxLength(24));
      s.addUserOption((o) => o.setName("usuario").setDescription("Jugador por su @ de Discord (con la cuenta vinculada) o usa 'name'"));
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
