const Discord = require("discord.js");

const Schema = require("../../database/models/family");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const target = interaction.options.getUser("user");
  const author = interaction.user;
  const guild = { Guild: interaction.guild.id };

  if (author.id == target.id)
    return client.errNormal(
      { error: "¡No puedes casarte contigo mismo!", type: "editreply" },
      interaction,
    );

  Schema.findOne({ Guild: interaction.guild.id, Partner: author.id }).then(
    async (data) => {
      if (data) {
        client.errNormal(
          {
            error: "¡Alguien de la pareja ya está casado!",
            type: "editreply",
          },
          interaction,
        );
      } else {
        Schema.findOne({
          Guild: interaction.guild.id,
          Partner: target.id,
        }).then(async (data) => {
          if (data) {
            client.errNormal(
              {
                error: "¡Alguien de la pareja ya está casado!",
                type: "editreply",
              },
              interaction,
            );
          } else {
            Schema.findOne({
              Guild: interaction.guild.id,
              User: target.id,
              Parent: author.id,
            }).then(async (data) => {
              if (data) {
                client.errNormal(
                  {
                    error: "¡No puedes casarte con un miembro de tu familia!",
                    type: "editreply",
                  },
                  interaction,
                );
              } else {
                Schema.findOne({
                  Guild: interaction.guild.id,
                  User: author.id,
                  Parent: target.id,
                }).then(async (data) => {
                  if (data) {
                    client.errNormal(
                      {
                        error: "¡No puedes casarte con un miembro de tu familia!",
                        type: "editreply",
                      },
                      interaction,
                    );
                  } else {
                    Schema.findOne({
                      Guild: interaction.guild.id,
                      User: author.id,
                    }).then(async (data) => {
                      if (data) {
                        if (data.Children.includes(target.id)) {
                          client.errNormal(
                            {
                              error: "¡No puedes casarte con un miembro de tu familia!",
                              type: "editreply",
                            },
                            interaction,
                          );
                        } else {
                          propose();
                        }
                      } else {
                        propose();
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    },
  );

  function propose() {
    const row = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("propose_accept")
        .setEmoji("✅")
        .setStyle(Discord.ButtonStyle.Success),

      new Discord.ButtonBuilder()
        .setCustomId("propose_deny")
        .setEmoji("❌")
        .setStyle(Discord.ButtonStyle.Danger),
    );

    client.embed(
      {
        title: `👰・Propuesta de matrimonio`,
        desc: `¡${author} le propuso matrimonio a ${target}! \n${target}, haz clic en uno de los botones`,
        components: [row],
        content: `${target}`,
        type: "editreply",
      },
      interaction,
    );

    const filter = (i) => i.user.id === target.id;

    interaction.channel
      .awaitMessageComponent({
        filter,
        componentType: Discord.ComponentType.Button,
        time: 60000,
      })
      .then(async (i) => {
        if (i.customId == "propose_accept") {
          Schema.findOne({ Guild: interaction.guild.id, User: author.id }).then(
            async (data) => {
              if (data) {
                data.Partner = target.id;
                data.save();
              } else {
                new Schema({
                  Guild: interaction.guild.id,
                  User: author.id,
                  Partner: target.id,
                }).save();
              }
            },
          );

          Schema.findOne({ Guild: interaction.guild.id, User: target.id }).then(
            async (data) => {
              if (data) {
                data.Partner = author.id;
                data.save();
              } else {
                new Schema({
                  Guild: interaction.guild.id,
                  User: target.id,
                  Partner: author.id,
                }).save();
              }
            },
          );

          client.embed(
            {
              title: `👰・Propuesta de matrimonio - Aceptada`,
              desc: `¡${author} y ${target} ahora están casados! 👰🎉`,
              components: [],
              content: `${target}`,
              type: "editreply",
            },
            interaction,
          );
        }

        if (i.customId == "propose_deny") {
          client.embed(
            {
              title: `👰・Propuesta de matrimonio - Rechazada`,
              desc: `${target} ama a otra persona y decidió no casarse con ${author}`,
              components: [],
              content: `${target}`,
              type: "editreply",
            },
            interaction,
          );
        }
      })
      .catch(() => {
        client.embed(
          {
            title: `👰・Propuesta de matrimonio - Rechazada`,
            desc: `¡${target} no respondió! Se canceló la boda`,
            components: [],
            content: `${target}`,
            type: "editreply",
          },
          interaction,
        );
      });
  }
};
