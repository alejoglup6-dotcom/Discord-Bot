const Discord = require("discord.js");

const Schema = require("../../database/models/economy");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let amount = interaction.options.getNumber("amount");
  let user = interaction.user;

  if (!amount)
    return client.errUsage(
      { usage: "deposit [cantidad]", type: "editreply" },
      interaction,
    );

  if (isNaN(amount))
    return client.errNormal(
      { error: "¡Introduce un número válido!", type: "editreply" },
      interaction,
    );

  if (amount < 0)
    return client.errNormal(
      { error: `¡No puedes depositar dinero negativo!`, type: "editreply" },
      interaction,
    );

  Schema.findOne({ Guild: interaction.guild.id, User: user.id }).then(
    async (data) => {
      if (data) {
        if (data.Money < parseInt(amount))
          return client.errNormal(
            { error: `¡No tienes tanto dinero!`, type: "editreply" },
            interaction,
          );

        let money = parseInt(amount);

        data.Money -= money;
        data.Bank += money;
        data.save();

        client.succNormal(
          {
            text: `¡Depositaste dinero en tu banco!`,
            fields: [
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
          { text: `¡No tienes dinero para depositar!`, type: "editreply" },
          interaction,
        );
      }
    },
  );
};
