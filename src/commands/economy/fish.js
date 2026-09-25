const Discord = require("discord.js");
const ms = require("ms");

const Schema = require("../../database/models/economy");
const Schema2 = require("../../database/models/economyTimeout");
const itemSchema = require("../../database/models/economyItems");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const rand = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
  };

  let user = interaction.user;

  let timeout = 60000;
  let fish = [
    "Pez amarillo :tropical_fish:",
    "Pez globo :blowfish:",
    "Pez azul :fish:",
    "Coco :coconut:",
    "Delfín :dolphin:",
    "Langosta :lobster:",
    "Tiburón :shark:",
    "Cangrejo :crab:",
    "Calamar :squid:",
    "Ballena :whale2:",
    "Camarón :shrimp:",
    "Pulpo :octopus:",
    "Diamante :gem:",
  ];

  let randn = rand(0, parseInt(fish.length));
  let randrod = rand(15, 30);

  let fishToWin = fish[randn];

  const userItems = await itemSchema.findOne({
    Guild: interaction.guild.id,
    User: user.id,
  });

  if (!userItems || userItems.FishingRod == false)
    return client.errNormal(
      { error: "¡Tienes que comprar una caña de pescar!", type: "editreply" },
      interaction,
    );

  if (userItems) {
    if (userItems.FishingRodUsage >= randrod) {
      userItems.FishingRod = false;
      userItems.save();

      return client.errNormal(
        {
          error: "¡Tu caña de pescar se rompió! ¡Ve a comprar una nueva!",
          type: "editreply",
        },
        interaction,
      );
    }
  }

  Schema2.findOne({ Guild: interaction.guild.id, User: user.id }).then(
    async (dataTime) => {
      if (
        dataTime &&
        dataTime.Fish !== null &&
        timeout - (Date.now() - dataTime.Fish) > 0
      ) {
        let time = (dataTime.Fish / 1000 + timeout / 1000).toFixed(0);

        return client.errWait({ time: time, type: "editreply" }, interaction);
      } else {
        client.succNormal(
          {
            text: `Pescaste y conseguiste: ${fishToWin}`,
            type: "editreply",
          },
          interaction,
        );

        if (userItems) {
          userItems.FishingRodUsage += 1;
          userItems.save();
        }

        if (dataTime) {
          dataTime.Fish = Date.now();
          dataTime.save();
        } else {
          new Schema2({
            Guild: interaction.guild.id,
            User: user.id,
            Fish: Date.now(),
          }).save();
        }
      }
    },
  );
};
