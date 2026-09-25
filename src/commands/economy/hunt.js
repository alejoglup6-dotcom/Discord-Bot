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
  let hunt = [
    "Conejo :rabbit:",
    "Rana :frog:",
    "Mono :monkey:",
    "Pollo :chicken:",
    "Lobo :wolf:",
    "Gallo :rooster:",
    "Pavo :turkey:",
    "Ardilla :chipmunk:",
    "Búfalo de agua :water_buffalo:",
    "Caballo de carreras :racehorse:",
    "Cerdo :pig:",
    "Serpiente :snake:",
    "Vaca :cow:",
  ];

  let randn = rand(0, parseInt(hunt.length));
  let randrod = rand(15, 30);

  let huntToWin = hunt[randn];

  Schema2.findOne({ Guild: interaction.guild.id, User: user.id }).then(
    async (dataTime) => {
      if (
        dataTime &&
        dataTime.Hunt !== null &&
        timeout - (Date.now() - dataTime.Hunt) > 0
      ) {
        let time = (dataTime.Hunt / 1000 + timeout / 1000).toFixed(0);

        return client.errWait({ time: time, type: "editreply" }, interaction);
      } else {
        client.succNormal(
          {
            text: `Cazaste y conseguiste: ${huntToWin}`,
            type: "editreply",
          },
          interaction,
        );

        if (dataTime) {
          dataTime.Hunt = Date.now();
          dataTime.save();
        } else {
          new Schema2({
            Guild: interaction.guild.id,
            User: user.id,
            Hunt: Date.now(),
          }).save();
        }
      }
    },
  );
};
