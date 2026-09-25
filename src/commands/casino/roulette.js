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
        function isOdd(num) {
          if (num % 2 == 0) return false;
          else if (num % 2 == 1) return true;
        }

        let colour = interaction.options.getString("color");
        let money = parseInt(interaction.options.getNumber("amount"));

        let random = Math.floor(Math.random() * 37);

        if (!colour || !money)
          return client.errUsage(
            { usage: "roulette [color] [cantidad]", type: "editreply" },
            interaction,
          );
        colour = colour.toLowerCase();
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

        if (random == 0 && colour == 2) {
          // Green
          money *= 15;

          data.Money += money;
          data.save();

          client.embed(
            {
              title: `🎰・Multiplicador: 15x`,
              desc: `Ganaste **${client.emotes.economy.coins} $${money}**`,
              type: "editreply",
            },
            interaction,
          );
        } else if (isOdd(random) && colour == 1) {
          // Red
          money = parseInt(money * 1.5);
          data.Money += money;
          data.save();

          client.embed(
            {
              title: `🎰・Multiplicador: 1.5x`,
              desc: `Ganaste **${client.emotes.economy.coins} $${money}**`,
              type: "editreply",
            },
            interaction,
          );
        } else if (!isOdd(random) && colour == 0) {
          // Black
          money = parseInt(money * 2);
          data.Money += money;
          data.save();

          client.embed(
            {
              title: `🎰・Multiplicador: 2x`,
              desc: `Ganaste **${client.emotes.economy.coins} $${money}**`,
              type: "editreply",
            },
            interaction,
          );
        } else {
          // Wrong
          data.Money -= money;
          data.save();

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
