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
      {
        error: "No puedes desheredarte a ti mismo",
        type: "editreply",
      },
      interaction,
    );

  if (target.bot)
    return client.errNormal(
      {
        error: "No puedes desheredar a un bot",
        type: "editreply",
      },
      interaction,
    );

  Schema.findOne({ Guild: interaction.guild.id, Parent: target.id }).then(
    async (data) => {
      if (data) {
        Schema.findOne({ Guild: interaction.guild.id, User: data.Parent }).then(
          async (data2) => {
            if (data2) {
              client.embed(
                {
                  title: `👪・Desheredado`,
                  desc: `${author} desheredó a <@!${data.Parent}>`,
                  type: "editreply",
                },
                interaction,
              );

              data.Parent = null;
              data.save();
            }
          },
        );
      } else {
        Schema.findOne({ Guild: interaction.guild.id, User: author.id }).then(
          async (data) => {
            if (data) {
              if (data.Children.includes(target.username)) {
                const filtered = data.Children.filter(
                  (user) => user !== target.username,
                );

                await Schema.findOneAndUpdate(guild, {
                  Guild: interaction.guild.id,
                  User: author.id,
                  Children: filtered,
                });

                Schema.findOne({
                  Guild: interaction.guild.id,
                  Parent: author.id,
                }).then(async (data) => {
                  if (data) {
                    data.Parent = null;
                    data.save();
                  }
                });

                client.embed(
                  {
                    title: `👪・Desheredado`,
                    desc: `${author} desheredó a <@!${target.id}>`,
                    type: "editreply",
                  },
                  interaction,
                );
              } else {
                client.errNormal(
                  {
                    error: "Ahora mismo no tienes hijos ni padres",
                    type: "editreply",
                  },
                  interaction,
                );
              }
            } else {
              client.errNormal(
                {
                  error: "Ahora mismo no tienes hijos ni padres",
                  type: "editreply",
                },
                interaction,
              );
            }
          },
        );
      }
    },
  );
};
