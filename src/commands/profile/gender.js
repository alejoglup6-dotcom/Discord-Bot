const Schema = require("../../database/models/profile");
const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  Schema.findOne({ User: interaction.user.id }).then(async (data) => {
    if (data) {
      const menu = new Discord.StringSelectMenuBuilder()
        .setCustomId("gender-setup")
        .setPlaceholder("❌┆Nada seleccionado")
        .addOptions(
          {
            emoji: "👨",
            label: `Hombre`,
            value: `Hombre`,
          },
          {
            emoji: "👩",
            label: `Mujer`,
            value: `Mujer`,
          },
          {
            emoji: "👪",
            label: `Otro`,
            value: `Otro`,
          },
        );

      const row = new Discord.ActionRowBuilder().addComponents(menu);

      client
        .embed(
          {
            desc: `Elige un género`,
            type: "editreply",
            components: [row],
          },
          interaction,
        )
        .then((msg) => {
          const filter = (i) => i.user.id === interaction.user.id;

          interaction.channel
            .awaitMessageComponent({
              filter,
              max: 1,
              componentType: Discord.ComponentType.StringSelect,
            })
            .then((i) => {
              if (i.customId == "gender-setup") {
                data.Gender = i.values[0];
                data.save();

                client.succNormal(
                  {
                    text: "Tu género se guardó como " + i.values[0],
                    type: "editreply",
                    components: [],
                  },
                  interaction,
                );
              }
            });
        });
    } else {
      return client.errNormal(
        {
          error: "¡No se encontró ningún perfil! Crea uno con createprofile",
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
