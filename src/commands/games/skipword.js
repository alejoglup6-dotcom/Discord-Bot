const Discord = require("discord.js");

const Schema = require("../../database/models/guessWord");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let wordList = client.config.wordList;

  Schema.findOne({
    Guild: interaction.guild.id,
    Channel: interaction.channel.id,
  }).then(async (data) => {
    if (data) {
      try {
        wordList = wordList.split("\n");
        var word = wordList[Math.floor(Math.random() * wordList.length)];
        var shuffled = word
          .split("")
          .sort(function () {
            return 0.5 - Math.random();
          })
          .join("");

        data.Word = word;
        data.save();

        client.succNormal(
          {
            text: `¡Palabra saltada correctamente!`,
            type: "ephemeral",
          },
          interaction,
        );

        return client.embed(
          {
            title: `💬・Adivina la palabra`,
            desc: `¡Pon las letras en la posición correcta! \n\n🔀 ${shuffled.toLowerCase()}`,
          },
          interaction.channel,
        );
      } catch {}
    } else {
      client.errNormal(
        {
          error: "¡No estás en el canal correcto!",
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
