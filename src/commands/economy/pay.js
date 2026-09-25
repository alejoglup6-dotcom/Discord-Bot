const Discord = require("discord.js");

const Schema = require("../../database/models/economy");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const user = await interaction.guild.members.fetch(
    interaction.options.getUser("user"),
  );
  let amount = interaction.options.getNumber("amount");

  if (amount < 0)
    return client.errNormal(
      { error: `¡No puedes pagar dinero negativo!`, type: "editreply" },
      interaction,
    );

  if (user.id == interaction.user.id) {
    return client.errNormal(
      {
        error: "¡No puedes pagarte a ti mismo!",
        type: "editreply",
      },
      interaction,
    );
  }

  Schema.findOne({
    Guild: interaction.guild.id,
    User: interaction.user.id,
  }).then(async (data) => {
    if (data) {
      if (data.Money < parseInt(amount))
        return client.errNormal(
          { error: `¡No tienes tanto dinero!`, type: "editreply" },
          interaction,
        );

      let money = parseInt(amount);

      data.Money -= money;
      data.save();

      client.addMoney(interaction, user, money);

      client.succNormal(
        {
          text: `¡Le pagaste dinero a un usuario!`,
          fields: [
            {
              name: `👤┆Usuario`,
              value: `$${user}`,
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
        { text: `¡No tienes dinero!`, type: "editreply" },
        interaction,
      );
    }
  });
};
