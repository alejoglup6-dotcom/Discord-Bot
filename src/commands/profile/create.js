const Schema = require("../../database/models/profile");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      return client.errNormal(
        { error: "Ya tienes un perfil de Bot", type: "editreply" },
        interaction,
      );
    } else {
      new Schema({
        User: interaction.user.id,
      }).save();

      client.succNormal(
        {
          text: "¡Perfil creado! Míralo con \`profile\`",
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
