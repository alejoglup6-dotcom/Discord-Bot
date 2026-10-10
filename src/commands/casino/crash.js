const Discord = require("discord.js");

const Schema = require("../../database/models/economy");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let user = interaction.user;
  // Punto de estrellón con ventaja de la casa de 6%: P(llegar a x) = 0.94 / x, tope 5x.
  // Cada paso del juego sube el multiplicador 0.2; "result" es el último paso que se llega a mostrar.
  // (Antes: paso 1..12 al azar. Retirarse siempre en 1.2x pagaba +20% sin riesgo, y hasta +120% antes de arreglar el pago.)
  const crashPoint = Math.min(5, 0.94 / (1 - Math.random()));
  var result = Math.max(0, Math.floor((crashPoint - 1) / 0.2 + 1e-9));

  Schema.findOne({ Guild: interaction.guild.id, User: user.id }).then(
    async (data) => {
      if (data) {
        let money = parseInt(interaction.options.getNumber("amount"));
        if (!money)
          return client.errUsage(
            { usage: "crash [cantidad]", type: "editreply" },
            interaction,
          );

        if (!Number.isFinite(money) || money <= 0)
          return client.errNormal(
            { error: `¡La apuesta debe ser un número positivo!`, type: "editreply" },
            interaction,
          );
        if (money > data.Money)
          return client.errNormal(
            { error: `¡Estás apostando más de lo que tienes!`, type: "editreply" },
            interaction,
          );

        // Descuenta la apuesta de forma atómica (evita apuestas paralelas y saldo negativo)
        const _debit = await Schema.updateOne(
          { Guild: interaction.guild.id, User: user.id, Money: { $gte: money } },
          { $inc: { Money: -money } },
        );
        if (!_debit.modifiedCount)
          return client.errNormal(
            { error: `¡Estás apostando más de lo que tienes!`, type: "editreply" },
            interaction,
          );
        let settled = false; // evita pagar y perder la misma partida

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
                if (settled) return;
                settled = true; // la apuesta ya se descontó al inicio

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
                  if (settled) return; // ya se estrelló: no se paga
                  settled = true;

                  index = result + 1;
                  const payout = Math.floor(money * multiplier); // apuesta + ganancia
                  const profit = payout - money;

                  await Schema.updateOne(
                    { Guild: interaction.guild.id, User: user.id },
                    { $inc: { Money: payout } },
                  );

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
                if (settled) return;
                settled = true; // la apuesta ya se descontó al inicio
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
