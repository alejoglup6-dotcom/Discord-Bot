const Discord = require("discord.js");

const Schema = require("../../database/models/messages");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let user = interaction.options.getUser("user");
  let amount = interaction.options.getNumber("amount");

  const perms = await client.checkUserPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.ManageMessages],
      perms: [Discord.PermissionsBitField.Flags.ManageMessages],
    },
    interaction,
  );

  if (perms == false) return;

  const data = await Schema.findOne({
    Guild: interaction.guild.id,
    User: user.id,
  });
  if (data) {
    data.Messages -= amount;
    await data.save();
  } else {
    return client.errNormal(
      {
        error: `No se encontraron datos de mensajes de ${user}`,
        type: "editreply",
      },
      interaction,
    );
  }

  client.succNormal(
    {
      text: `Se quitaron **${amount}** mensajes a ${user}`,
      fields: [
        {
          name: "💬┆Mensajes totales",
          value: `${data.Messages}`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
