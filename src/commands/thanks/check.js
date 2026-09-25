const Discord = require("discord.js");
const thanksSchema = require("../../database/models/thanks");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const member = interaction.options.getUser("user");

  thanksSchema.findOne({ User: member.id }).then(async (data) => {
    if (data) {
      return client.embed(
        {
          title: `🤝・Agradecimientos`,
          desc: `**${member.tag}** tiene \`${data.Received}\` agradecimientos`,
          type: "editreply",
        },
        interaction,
      );
    } else {
      return client.embed(
        {
          title: `🤝・Agradecimientos`,
          desc: `**${member.tag}** tiene \`0\` agradecimientos`,
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
