const Discord = require("discord.js");

const thanksSchema = require("../../database/models/thanks");
const thanksAuthor = require("../../database/models/thanksAuthor");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const target = interaction.options.getUser("user");
  if (!target)
    return client.errUsage(
      { usage: "thanks [mencionar usuario]", type: "editreply" },
      interaction,
    );

  if (target.id === interaction.user.id)
    return client.errNormal(
      { error: `¡No puedes agradecerte a ti mismo!`, type: "editreply" },
      interaction,
    );

  thanksAuthor
    .findOne({ User: target.id, Author: interaction.user.id })
    .then(async (data) => {
      if (data) {
        client.errNormal(
          { error: `¡Ya le agradeciste a este usuario!`, type: "editreply" },
          interaction,
        );
      } else {
        thanksSchema.findOne({ User: target.id }).then(async (data) => {
          if (data) {
            data.Received += 1;
            data.save();
            client.succNormal(
              {
                text: `¡Le agradeciste a <@${target.id}>! Ahora tiene \`${data.Received}\` agradecimientos`,
                type: "editreply",
              },
              interaction,
            );
          } else {
            new thanksSchema({
              User: target.id,
              UserTag: target.tag,
              Received: 1,
            }).save();
            client.succNormal(
              {
                text: `¡Le agradeciste a <@${target.id}>! Ahora tiene \`1\` agradecimiento`,
                type: "editreply",
              },
              interaction,
            );
          }
        });

        new thanksAuthor({
          User: target.id,
          Author: interaction.user.id,
        }).save();
      }
    });
};
