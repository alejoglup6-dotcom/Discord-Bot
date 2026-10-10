const Discord = require("discord.js");

const Schema = require("../../database/models/economy");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let user = interaction.user;

  Schema.findOne({ Guild: interaction.guild.id, User: user.id }).then(
    async (data) => {
      if (data) {
        // Colores reales de la ruleta europea (0 es verde). Rojo y negro pagan 1:1 y el verde 35:1,
        // con lo que la casa se queda 2.7% (antes negro daba +54% y rojo +22% al jugador).
        const RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

        let colour = interaction.options.getString("color");
        let money = parseInt(interaction.options.getNumber("amount"));

        let random = Math.floor(Math.random() * 37);

        if (!colour || !money)
          return client.errUsage(
            { usage: "roulette [color] [cantidad]", type: "editreply" },
            interaction,
          );
        colour = colour.toLowerCase();
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

        if (colour == "b" || colour.includes("black")) colour = 0;
        else if (colour == "r" || colour.includes("red")) colour = 1;
        else if (colour == "g" || colour.includes("green")) colour = 2;
        else
          return client.errNormal(
            { error: `¡No se indicó un color válido!`, type: "editreply" },
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
        if (random == 0 && colour == 2) {
          // Green
          money *= 35;

          await Schema.updateOne({ Guild: interaction.guild.id, User: user.id }, { $inc: { Money: stake + money } });

          client.embed(
            {
              title: `🎰・Pago 35:1`,
              desc: `Ganaste **${client.emotes.economy.coins} $${money}**`,
              type: "editreply",
            },
            interaction,
          );
        } else if (RED.includes(random) && colour == 1) {
          // Red
          await Schema.updateOne({ Guild: interaction.guild.id, User: user.id }, { $inc: { Money: stake + money } });

          client.embed(
            {
              title: `🎰・Pago 1:1`,
              desc: `Ganaste **${client.emotes.economy.coins} $${money}**`,
              type: "editreply",
            },
            interaction,
          );
        } else if (random !== 0 && !RED.includes(random) && colour == 0) {
          // Black
          await Schema.updateOne({ Guild: interaction.guild.id, User: user.id }, { $inc: { Money: stake + money } });

          client.embed(
            {
              title: `🎰・Pago 1:1`,
              desc: `Ganaste **${client.emotes.economy.coins} $${money}**`,
              type: "editreply",
            },
            interaction,
          );
        } else {
          // Wrong
          // La apuesta ya se descontó al inicio

          client.embed(
            {
              title: `🎰・Multiplicador: 0x`,
              desc: `Perdiste **${client.emotes.economy.coins} $${money}**`,
              type: "editreply",
            },
            interaction,
          );
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
