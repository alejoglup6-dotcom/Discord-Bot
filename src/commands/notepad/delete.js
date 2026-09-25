const Discord = require("discord.js");
const generator = require("generate-password");

const Schema = require("../../database/models/notes");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let id = interaction.options.getString("id");

  Schema.findOne({ Guild: interaction.guild.id, Code: id }).then(
    async (data) => {
      if (data) {
        Schema.findOneAndDelete({ Guild: interaction.guild.id, Code: id }).then(
          () => {
            client.succNormal(
              { text: `¡La nota **#${id}** se eliminó!`, type: "editreply" },
              interaction,
            );
          },
        );
      } else {
        client.errNormal(
          { error: `No se encontró ninguna nota con el ID **#${id}**`, type: "editreply" },
          interaction,
        );
      }
    },
  );
};
