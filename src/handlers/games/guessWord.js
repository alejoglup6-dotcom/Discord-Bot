const Discord = require('discord.js');

const Schema = require("../../database/models/guessWord");

module.exports = async (client) => {
  client.on(Discord.Events.MessageCreate, async (message) => {
    if (message.author.bot || message.channel.type === Discord.ChannelType.DM) return;

    let wordList = client.config.wordList;
    wordList = wordList.split("\n");

    const data = await Schema.findOne({ Guild: message.guild.id, Channel: message.channel.id });

    if (data) {
      if (message.content.toLowerCase() == data.Word.toLowerCase()) {
        message.react(client.emotes.normal.check);
        var word = wordList[Math.floor(Math.random() * wordList.length)];
        var shuffled = word.split('').sort(function () { return 0.5 - Math.random() }).join('');

        let amount = Math.floor(Math.random() * 100) + 1;
        client.addMoney(message, message.author, amount);

        client.embed({
          title: `💬・Adivina la palabra`,
          desc: `Se adivinó la palabra y vale $${amount}`,
          fields: [
            {
              name: `👤┇Adivinado por`,
              value: `${message.author} (${message.author.tag})`,
              inline: true
            },
            {
              name: `💬┇Palabra correcta`,
              value: `${data.Word}`,
              inline: true
            }
          ]
        }, message.channel);

        data.Word = word;
        data.save();

        return client.embed({
          title: `💬・Adivina la palabra`,
          desc: `¡Pon las letras en la posición correcta!`,
          fields: [
            {
              name: `🔀┆Palabra`,
              value: `${shuffled.toLowerCase()}`
            }
          ]
        }, message.channel)
      }
      else {
        return message.react(client.emotes.normal.error);
      }
    }
  });
}