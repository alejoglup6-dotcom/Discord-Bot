const slotItems = ["🍇", "🍉", "🍊", "🍎", "🍓", "🍒"];
// Pagos (ganancia neta sobre la apuesta). Con 6 símbolos: tres iguales 1/36, par exacto 5/12, nada 5/9.
// Con 10x y 0.5x la casa se queda ~6.9% a largo plazo (antes 9x y 2x daban +53% al jugador: imprimía dinero).
const SLOTS_TRIPLE = 10;
const SLOTS_PAIR = 0.5;
const Discord = require("discord.js");
const ms = require("parse-ms");

const Schema = require("../../database/models/economy");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let user = interaction.user;

  Schema.findOne({ Guild: interaction.guild.id, User: user.id }).then(
    async (data) => {
      if (data) {
        let money = parseInt(interaction.options.getNumber("amount"));
        let win = false;

        if (!money)
          return client.errUsage(
            { usage: "slots [cantidad]", type: "editreply" },
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
        const stake = money;
        let number = [];
        for (let i = 0; i < 3; i++) {
          number[i] = Math.floor(Math.random() * slotItems.length);
        }

        if (number[0] == number[1] && number[1] == number[2]) {
          money *= SLOTS_TRIPLE; // ganancia neta de 10x la apuesta
          win = true;
        } else if (
          number[0] == number[1] ||
          number[0] == number[2] ||
          number[1] == number[2]
        ) {
          money = Math.floor(money * SLOTS_PAIR); // ganancia neta de 0.5x la apuesta
          win = true;
        }

        const row = new Discord.ActionRowBuilder().addComponents(
          new Discord.ButtonBuilder()
            .setCustomId("slots_1")
            .setLabel(`${slotItems[number[0]]}`)
            .setStyle(Discord.ButtonStyle.Primary),

          new Discord.ButtonBuilder()
            .setCustomId("slots_2")
            .setLabel(`${slotItems[number[1]]}`)
            .setStyle(Discord.ButtonStyle.Primary),

          new Discord.ButtonBuilder()
            .setCustomId("slots_3")
            .setLabel(`${slotItems[number[2]]}`)
            .setStyle(Discord.ButtonStyle.Primary),
        );
        if (win) {
          client.embed(
            {
              title: `🎰・Tragamonedas`,
              desc: `Ganaste **${client.emotes.economy.coins} $${money}**`,
              color: client.config.colors.succes,
              components: [row],
              type: "editreply",
            },
            interaction,
          );

          await Schema.updateOne({ Guild: interaction.guild.id, User: user.id }, { $inc: { Money: stake + money } });
        } else {
          client.embed(
            {
              title: `🎰・Tragamonedas`,
              desc: `Perdiste **${client.emotes.economy.coins} $${money}**`,
              components: [row],
              color: client.config.colors.error,
              type: "editreply",
            },
            interaction,
          );

          // La apuesta ya se descontó al inicio
        }
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
