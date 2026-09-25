const Discord = require("discord.js");

const Schema = require("../../database/models/economy");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const perms = await client.checkUserPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.Administrator],
      perms: [Discord.PermissionsBitField.Flags.Administrator],
    },
    interaction,
  );

  if (perms == false) return;

  const user = interaction.options.getUser("user");
  let amount = interaction.options.getNumber("amount");

  if (!user || !amount)
    return client.errUsage(
      { usage: "addmoney [usuario] [cantidad]", type: "editreply" },
      interaction,
    );

  if (isNaN(amount))
    return client.errNormal(
      { error: "¡Introduce un número válido!", type: "editreply" },
      interaction,
    );

  if (user.bot)
    return client.errNormal(
      {
        error: "¡No puedes darle dinero a un bot!",
        type: "editreply",
      },
      interaction,
    );

  client.addMoney(interaction, user, parseInt(amount));

  setTimeout(() => {
    Schema.findOne({ Guild: interaction.guild.id, User: user.id }).then(
      async (data) => {
        if (data) {
          client.succNormal(
            {
              text: `¡Se añadió dinero a un usuario!`,
              fields: [
                {
                  name: `👤┆Usuario`,
                  value: `<@!${user.id}>`,
                  inline: true,
                },
                {
                  name: `${client.emotes.economy.coins}┆Cantidad`,
                  value: `$${amount}`,
                  inline: true,
                },
              ],
              type: "editreply",
            },
            interaction,
          );
        } else {
          client.errNormal(
            { error: `¡Este usuario no tiene dinero!`, type: "editreply" },
            interaction,
          );
        }
      },
      500,
    );
  });
};
