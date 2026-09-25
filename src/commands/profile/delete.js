const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      Schema.findOneAndDelete({
        Guild: interaction.guild.id,
        User: interaction.user.id,
      }).then(() => {
        client.succNormal(
          {
            text: "¡Tu perfil se eliminó!",
            type: "editreply",
          },
          interaction,
        );
      });
    } else {
      client.errNormal(
        {
          error: "¡No se encontró ningún perfil!",
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
