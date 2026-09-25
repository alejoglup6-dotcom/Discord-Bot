const Discord = require("discord.js");

const Schema = require("../../database/models/economy");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let user = interaction.user;
  var result = Math.ceil(Math.random() * 12);

  Schema.findOne({ Guild: interaction.guild.id, User: user.id }).then(
    async (data) => {
      if (data) {
        let money = parseInt(interaction.options.getNumber("amount"));
        if (!money)
          return client.errUsage(
            { usage: "crash [cantidad]", type: "editreply" },
            interaction,
          );

        if (money > data.Money)
          return client.errNormal(
            { error: `¡Estás apostando más de lo que tienes!`, type: "editreply" },
            interaction,
          );

        const row = new Discord.ActionRowBuilder().addComponents(
          new Discord.ButtonBuilder()
            .setCustomId("crash_stop")
            .setEmoji("🛑")
            .setStyle(Discord.ButtonStyle.Danger),
        );

        const disableRow = new Discord.ActionRowBuilder().addComponents(
          new Discord.ButtonBuilder()
            .setCustomId("crash_stop")
            .setEmoji("🛑")
            .setStyle(Discord.ButtonStyle.Danger)
            .setDisabled(true),
        );

        client
          .embed(
            {
              desc: `Crash iniciado por ${user}・Reacciona con 🛑 para detenerlo`,
              fields: [
                {
                  name: `Multiplicador`,
                  value: `1x`,
                  inline: true,
                },
                {
                  name: `Ganancia`,
                  value: `**0**`,
                  inline: true,
                },
              ],
              components: [row],
              type: "editreply",
            },
            interaction,
          )
          .then((msg) => {
            let multiplier = 1;
            let index = 0;

            let times = result + 1;
            let timer = 2000 * times;

            const crashInterval = setInterval(() => {
              if (index === result + 1) {
                clearInterval(crashInterval);
                return;
              } else if (index === result) {
                clearInterval(crashInterval);
                Schema.findOne({
                  Guild: interaction.guild.id,
                  User: user.id,
                }).then(async (data) => {
                  if (data) {
                    data.Money -= money;
                    data.save();
                  }
                });

                return client.embed(
                  {
                    title: `Resultados del crash de ${user}`,
                    desc: `${msg}`,
                    type: "edit",
                    fields: [
                      {
                        name: `Pérdida`,
                        value: `**${money}**`,
                        inline: false,
                      },
                    ],
                  },
                  msg,
                );
              } else {
                index += 1;
                multiplier += 0.2;

                let calc = money * multiplier;
                let profit = calc - money;

                client.embed(
                  {
                    desc: `Crash iniciado por ${user}・Reacciona con 🛑 para detenerlo`,
                    type: "edit",
                    fields: [
                      {
                        name: `Multiplicador`,
                        value: `${multiplier.toFixed(1)}x`,
                        inline: true,
                      },
                      {
                        name: `Ganancia`,
                        value: `**$${profit.toFixed(2)}**`,
                        inline: true,
                      },
                    ],
                    components: [row],
                  },
                  msg,
                );
              }
            }, 2000);

            const filter = (i) => i.user.id === interaction.user.id;
            interaction.channel
              .awaitMessageComponent({ filter, max: 1, time: timer })
              .then(async (i) => {
                if (i.customId == "crash_stop") {
                  clearInterval(crashInterval);
                  i.deferUpdate();

                  index = result + 1;
                  profit = money * multiplier;

                  Schema.findOne({
                    Guild: interaction.guild.id,
                    User: user.id,
                  }).then(async (data) => {
                    if (data) {
                      data.Money += parseInt(profit);
                      data.save();
                    }
                  });

                  return client.embed(
                    {
                      desc: `Resultados del crash de ${user}`,
                      fields: [
                        {
                          name: `Ganancia`,
                          value: `**$${profit.toFixed(2)}**`,
                          inline: false,
                        },
                      ],
                      components: [disableRow],
                      type: "edit",
                    },
                    msg,
                  );
                }
              })
              .catch(async () => {
                clearInterval(crashInterval);
                index = result + 1;

                Schema.findOne({
                  Guild: interaction.guild.id,
                  User: user.id,
                }).then(async (data) => {
                  if (data) {
                    data.Money -= money;
                    data.save();
                  }
                });
                return client.embed(
                  {
                    desc: `Resultados del crash de ${user}`,
                    type: "edit",
                    fields: [
                      {
                        name: `Pérdida`,
                        value: `**${money}**`,
                        inline: false,
                      },
                    ],
                    components: [disableRow],
                  },
                  msg,
                );
              });
          });
      } else {
        client.errNormal(
          {
            error: `¡No tienes ${client.emotes.economy.coins}!`,
            type: "editreply",
          },
          interaction,
        );
      }
    },
  );
};
