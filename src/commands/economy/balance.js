const Discord = require("discord.js");

const Schema = require("../../database/models/economy");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const user = interaction.options.getUser("user") || interaction.user;

  if (user.bot)
    return client.errNormal(
      {
        error: "¡No puedes ver el saldo de un bot!",
        type: "editreply",
      },
      interaction,
    );

  Schema.findOne({ Guild: interaction.guild.id, User: user.id }).then(
    async (data) => {
      if (data) {
        let total = data.Money + data.Bank;

        client.embed(
          {
            title: `${client.emotes.economy.coins}・Saldo`,
            fields: [
              {
                name: `${client.emotes.economy.pocket}┆Cartera`,
                value: `$${data.Money}`,
                inline: true,
              },
              {
                name: `${client.emotes.economy.bank}┆Banco`,
                value: `$${data.Bank}`,
                inline: true,
              },
              {
                name: `💰┆Total`,
                value: `$${total}`,
                inline: true,
              },
            ],
            desc: `El saldo actual de \`${user.tag}\``,
            type: "editreply",
          },
          interaction,
        );
      } else {
        client.errNormal(
          {
            error: `¡El usuario no tiene dinero!`,
            type: "editreply",
          },
          interaction,
        );
      }
    },
  );
};
