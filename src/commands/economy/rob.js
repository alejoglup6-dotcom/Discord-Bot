const Discord = require("discord.js");
const ms = require("ms");

const Schema = require("../../database/models/economy");
const Schema2 = require("../../database/models/economyTimeout");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const user = interaction.options.getUser("user");
  if (!user)
    return client.errUsage(
      { usage: "rob [mencionar usuario]", type: "editreply" },
      interaction,
    );

  if (user.bot)
    return client.errNormal(
      {
        error: "¡No puedes robarle a un bot!",
        type: "editreply",
      },
      interaction,
    );

  try {
    let timeout = 600000;

    Schema2.findOne({
      Guild: interaction.guild.id,
      User: interaction.user.id,
    }).then(async (dataTime) => {
      if (
        dataTime &&
        dataTime.Rob !== null &&
        timeout - (Date.now() - dataTime.Rob) > 0
      ) {
        let time = (dataTime.Rob / 1000 + timeout / 1000).toFixed(0);
        return client.errWait({ time: time, type: "editreply" }, interaction);
      } else {
        Schema.findOne({
          Guild: interaction.guild.id,
          User: interaction.user.id,
        }).then(async (authorData) => {
          if (authorData) {
            if (authorData.Money < 200)
              return client.errNormal(
                {
                  error: `¡Necesitas al menos 200 monedas en tu cartera para robarle a alguien!`,
                  type: "editreply",
                },
                interaction,
              );

            Schema.findOne({ Guild: interaction.guild.id, User: user.id }).then(
              async (targetData) => {
                if (targetData) {
                  var targetMoney = targetData.Money;
                  if (!targetMoney || targetMoney <= 0) {
                    return client.errNormal(
                      {
                        error: `¡${user.username} no tiene nada que puedas robar!`,
                        type: "editreply",
                      },
                      interaction,
                    );
                  }

                  if (dataTime) {
                    dataTime.Rob = Date.now();
                    dataTime.save();
                  } else {
                    new Schema2({
                      Guild: interaction.guild.id,
                      User: interaction.user.id,
                      Rob: Date.now(),
                    }).save();
                  }

                  var random = Math.floor(Math.random() * 100) + 1;
                  if (targetMoney < random) {
                    random = targetMoney;

                    authorData.Money += targetMoney;
                    authorData.save();

                    client.removeMoney(interaction, user, targetMoney);
                  } else {
                    authorData.Money += random;
                    authorData.save();

                    client.removeMoney(interaction, user, random);
                  }

                  client.succNormal(
                    {
                      text: `¡Le robaste a un usuario y escapaste!`,
                      fields: [
                        {
                          name: `👤┆Usuario`,
                          value: `${user}`,
                          inline: true,
                        },
                        {
                          name: `${client.emotes.economy.coins}┆Robado`,
                          value: `$${random}`,
                          inline: true,
                        },
                      ],
                      type: "editreply",
                    },
                    interaction,
                  );
                } else {
                  return client.errNormal(
                    {
                      error: `¡${user.username} no tiene nada que puedas robar!`,
                      type: "editreply",
                    },
                    interaction,
                  );
                }
              },
            );
          }
        });
      }
    });
  } catch {}
};
