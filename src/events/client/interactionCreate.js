const Discord = require("discord.js");
const Captcha = require("@haileybot/captcha-generator");

const reactionSchema = require("../../database/models/reactionRoles");
const banSchema = require("../../database/models/userBans");
const verify = require("../../database/models/verify");
const Commands = require("../../database/models/customCommand");
const CommandsSchema = require("../../database/models/customCommandAdvanced");
/**
 * 
 * @param {import('../../typings.d').Client} client 
 * @param {Discord.Interaction} interaction
 * @returns 
 */
module.exports = async (client, interaction) => {
  // Commands
  if (interaction.isCommand() || interaction.isUserContextMenuCommand()) {
    banSchema.findOne({ User: interaction.user.id }).then(async (data) => {
      if (data) {
        return client.errNormal(
          {
            error: "Los desarrolladores de este bot te banearon",
            type: "ephemeral",
          },
          interaction,
        );
      } else {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) {
          const cmdd = await Commands.findOne({
            Guild: interaction.guild.id,
            Name: interaction.commandName,
          })
            .lean()
            .cache("60 seconds")
            .exec();
          if (cmdd) {
            return interaction.channel.send({ content: cmdd.Responce });
          }

          const cmdx = await CommandsSchema.findOne({
            Guild: interaction.guild.id,
            Name: interaction.commandName,
          })
            .lean()
            .cache("60 seconds")
            .exec();
          if (cmdx) {
            // Remove interaction
            if (cmdx.Action == "Normal") {
              return interaction.reply({ content: cmdx.Responce });
            } else if (cmdx.Action == "Embed") {
              return client.simpleEmbed(
                {
                  desc: `${cmdx.Responce}`,
                  type: "reply",
                },
                interaction,
              );
            } else if (cmdx.Action == "DM") {
              await interaction.deferReply({ flags: Discord.MessageFlags.Ephemeral });
              interaction.editReply({
                content: "Te envié algo por MD",
              });
              return interaction.user
                .send({ content: cmdx.Responce })
                .catch((e) => {
                  client.errNormal(
                    {
                      error: "No puedo enviarte MD, ¡quizá los tienes desactivados!",
                      type: "ephemeral",
                    },
                    interaction,
                  );
                });
            }
          }
        }
        if (
          interaction.options._subcommand !== null &&
          interaction.options.getSubcommand() == "help"
        ) {
          const commands = interaction.client.commands
            .filter((x) => x.data.name == interaction.commandName)
            .map((x) =>
              x.data.options
                .map((c) => "`" + c.name + "` - " + c.description)
                .join("\n"),
            );

          return client.embed(
            {
              title: `❓・Panel de ayuda`,
              desc: `Consigue ayuda con los comandos de \`${interaction.commandName}\` \n\n${commands}`,
              type: "reply",
            },
            interaction,
          );
        }

        if (cmd)
          cmd
            .run(client, interaction, interaction.options._hoistedOptions)
            .catch((err) => {
              client.emit(
                "errorCreate",
                err,
                interaction.commandName,
                interaction,
              );
            });
      }
    });
  }

  // Verify system
  if (interaction.isButton() && interaction.customId == "Bot_verify") {
    const data = await verify
      .findOne({ Guild: interaction.guild.id, Channel: interaction.channel.id })
      .lean();
    if (data) {
      let captcha = new Captcha();

      try {
        var image = new Discord.AttachmentBuilder(captcha.JPEGStream, {
          name: "captcha.jpeg",
        });

        interaction
          .reply({ files: [image], withResponse: true })
          .then(function (msg) {
            const filter = (s) => s.author.id == interaction.user.id;

            interaction.channel
              .awaitMessages({ filter, max: 1 })
              .then((response) => {
                if (response.first().content === captcha.value) {
                  response.first().delete();
                  msg.resource.message.delete();

                  client
                    .succNormal(
                      {
                        text: "¡Te verificaste correctamente!",
                      },
                      interaction.user,
                    )
                    .catch((error) => {});

                  var verifyUser = interaction.guild.members.cache.get(
                    interaction.user.id,
                  );
                  verifyUser.roles.add(data.Role);
                } else {
                  response.first().delete();
                  msg.resource.message.delete();

                  client
                    .errNormal(
                      {
                        error: "¡Respondiste mal el captcha!",
                        type: "editreply",
                      },
                      interaction,
                    )
                    .then((msgError) => {
                      setTimeout(() => {
                        msgError.delete();
                      }, 2000);
                    });
                }
              });
          });
      } catch (error) {
        console.log(error);
      }
    } else {
      client.errNormal(
        {
          error:
            "¡La verificación está desactivada en este servidor! O estás usando el canal equivocado",
          type: "ephemeral",
        },
        interaction,
      );
    }
  }

  // Reaction roles button
  if (interaction.isButton()) {
    var buttonID = interaction.customId.split("-");

    if (buttonID[0] == "reaction_button") {
      reactionSchema
        .findOne({ Message: interaction.message.id })
        .lean()
        .then(async (data) => {
          if (!data) return;

          const [roleid] = data.Roles[buttonID[1]];

          if (interaction.member.roles.cache.get(roleid)) {
            interaction.guild.members.cache
              .get(interaction.user.id)
              .roles.remove(roleid)
              .catch((error) => {});

            interaction.reply({
              content: `¡Se quitó <@&${roleid}>!`,
              flags: Discord.MessageFlags.Ephemeral,
            });
          } else {
            interaction.guild.members.cache
              .get(interaction.user.id)
              .roles.add(roleid)
              .catch((error) => {});

            interaction.reply({
              content: `¡Se añadió <@&${roleid}>!`,
              flags: Discord.MessageFlags.Ephemeral,
            });
          }
        });
    }
  }

  // Reaction roles select
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId == "reaction_select") {
      reactionSchema
        .findOne({ Message: interaction.message.id })
        .lean()
        .then(async (data) => {
          if (!data) return;

          let roles = "";

          for (let i = 0; i < interaction.values.length; i++) {
            const [roleid] = data.Roles[interaction.values[i]];

            roles += `<@&${roleid}> `;

            if (interaction.member.roles.cache.get(roleid)) {
              interaction.guild.members.cache
                .get(interaction.user.id)
                .roles.remove(roleid)
                .catch((error) => {});
            } else {
              interaction.guild.members.cache
                .get(interaction.user.id)
                .roles.add(roleid)
                .catch((error) => {});
            }

            if (i + 1 === interaction.values.length) {
              interaction.reply({
                content: `Actualicé los siguientes roles: ${roles}`,
                flags: Discord.MessageFlags.Ephemeral,
              });
            }
          }
        });
    }
  }
  // Tickets
  if (interaction.customId == "Bot_openticket") {
    return require(`${process.cwd()}/src/commands/tickets/create.js`)(
      client,
      interaction,
    );
  }

  if (interaction.customId == "Bot_closeticket") {
    return require(`${process.cwd()}/src/commands/tickets/close.js`)(
      client,
      interaction,
    );
  }

  if (interaction.customId == "Bot_claimTicket") {
    return require(`${process.cwd()}/src/commands/tickets/claim.js`)(
      client,
      interaction,
    );
  }

  if (interaction.customId == "Bot_transcriptTicket") {
    return require(`${process.cwd()}/src/commands/tickets/transcript.js`)(
      client,
      interaction,
    );
  }

  if (interaction.customId == "Bot_openTicket") {
    return require(`${process.cwd()}/src/commands/tickets/open.js`)(
      client,
      interaction,
    );
  }

  if (interaction.customId == "Bot_deleteTicket") {
    return require(`${process.cwd()}/src/commands/tickets/delete.js`)(
      client,
      interaction,
    );
  }

  if (interaction.customId == "Bot_noticeTicket") {
    return require(`${process.cwd()}/src/commands/tickets/notice.js`)(
      client,
      interaction,
    );
  }
};
