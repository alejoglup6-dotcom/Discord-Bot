const Discord = require("discord.js");

const Schema = require("../../database/models/messageRewards");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let messages = interaction.options.getNumber("amount");
  let role = interaction.options.getRole("role");

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
        return client.errNormal(
          {
            error: "¡Esta cantidad de mensajes ya tiene una recompensa!",
            type: "editreply",
          },
          interaction,
        );
      } else {
        new Schema({
          Guild: interaction.guild.id,
          Messages: messages,
          Role: role.id,
        }).save();

        client.succNormal(
          {
            text: `Recompensa por mensajes creada`,
            fields: [
              {
                name: "📘┆Rol",
                value: `${role}`,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      }
    },
  );
};
