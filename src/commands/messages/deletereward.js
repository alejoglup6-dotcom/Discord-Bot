const Discord = require("discord.js");

const Schema = require("../../database/models/messageRewards");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let messages = interaction.options.getNumber("amount");

  const perms = await client.checkUserPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.ManageMessages],
      perms: [Discord.PermissionsBitField.Flags.ManageMessages],
    },
    interaction,
  );

  if (perms == false) return;

  Schema.findOne({ Guild: interaction.guild.id, Messages: messages }).then(
    async (data) => {
      if (data) {
        Schema.findOneAndDelete({
          Guild: interaction.guild.id,
          Messages: messages,
        }).then(() => {
          client.succNormal(
            {
              text: `Recompensa por mensajes eliminada`,
              fields: [
                {
                  name: "💬┆Mensajes",
                  value: `${messages}`,
                  inline: true,
                },
              ],
              type: "editreply",
            },
            interaction,
          );
        });
      } else {
        return client.errNormal(
          {
            error: "¡No hay ninguna recompensa para esta cantidad de mensajes!",
            type: "editreply",
          },
          interaction,
        );
      }
    },
  );
};
