const Discord = require("discord.js");
const Schema = require("../../database/models/customCommandAdvanced");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const cmdname = interaction.options.getString("command");
  Schema.findOne({
    Guild: interaction.guild.id,
    Name: cmdname.toLowerCase(),
  }).then(async (data) => {
    console.log(data);
    if (data) {
      Schema.findOneAndDelete({
        Guild: interaction.guild.id,
        Name: cmdname.toLowerCase(),
      }).then(async () => {
        var commands = await interaction.guild.commands.fetch();
        var command = await commands.find(
          (cmd) => cmd.name == cmdname.toLowerCase(),
        );
        if (!command)
          return client.errNormal(
            { error: "¡No se encontró este comando!", type: "editreply" },
            interaction,
          );
        await interaction.guild.commands.delete(command.id);

        client.succNormal(
          {
            text: `El comando se eliminó correctamente`,
            fields: [
              {
                name: "🔧┆Comando",
                value: `\`\`\`${cmdname}\`\`\``,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      });
    } else {
      client.errNormal(
        { error: "¡No se encontró este comando!", type: "editreply" },
        interaction,
      );
    }
  });
};
