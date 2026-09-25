const Discord = require("discord.js");

const Counting = require("../../database/models/countChannel");
const GTN = require("../../database/models/guessNumber");
const GTW = require("../../database/models/guessWord");
const WordSnake = require("../../database/models/wordsnake");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const choice = interaction.options.getString("setup");

  if (choice == "counting") {
    interaction.guild.channels
      .create({
        name: "counting",
        type: Discord.ChannelType.GuildText,
      })
      .then((ch) => {
        client.embed(
          {
            title: `🔢・Contar`,
            desc: `¡Aquí empieza el conteo! El primer número es **1**`,
          },
          ch,
        );

        client.createChannelSetup(Counting, ch, interaction);
      });
  }

  if (choice == "gtn") {
    interaction.guild.channels
      .create({
        name: "adivina-el-numero",
        type: Discord.ChannelType.GuildText,
      })
      .then((ch) => {
        client.embed(
          {
            title: `🔢・Adivina el número`,
            desc: `¡Adivina el número entre **1** y **10.000**!`,
          },
          ch,
        );

        client.createChannelSetup(GTN, ch, interaction);
      });
  }

  if (choice == "gtw") {
    interaction.guild.channels
      .create({
        name: "adivina-la-palabra",
        type: Discord.ChannelType.GuildText,
      })
      .then((ch) => {
        var word = "start";
        var shuffled = word
          .split("")
          .sort(function () {
            return 0.5 - Math.random();
          })
          .join("");

        client.embed(
          {
            title: `💬・Adivina la palabra`,
            desc: `¡Pon las letras en la posición correcta!`,
            fields: [
              {
                name: `🔀┆Palabra`,
                value: `${shuffled.toLowerCase()}`,
              },
            ],
          },
          ch,
        );

        client.createChannelSetup(GTW, ch, interaction);
      });
  }

  if (choice == "wordsnake") {
    interaction.guild.channels
      .create({
        name: "serpiente-de-palabras",
        type: Discord.ChannelType.GuildText,
      })
      .then((ch) => {
        client.createChannelSetup(WordSnake, ch, interaction);
      });
  }
};
