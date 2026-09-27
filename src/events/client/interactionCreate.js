const Discord = require("discord.js");
const createCaptcha = require("../../assets/utils/captcha");

const reactionSchema = require("../../database/models/reactionRoles");
const banSchema = require("../../database/models/userBans");
const verify = require("../../database/models/verify");
const { norm } = require("../../assets/utils/guildLookup");
const Commands = require("../../database/models/customCommand");
const CommandsSchema = require("../../database/models/customCommandAdvanced");
const { helpList } = require("../../assets/utils/prefixCommands");
const { names } = require("../../assets/utils/localizations");
/**
 * 
 * @param {import('../../typings.d').Client} client 
 * @param {Discord.Interaction} interaction
 * @returns 
 */
module.exports = async (client, interaction) => {
  // El bot solo funciona dentro de servidores
  if (!interaction.guild) return;

  // Commands
  if (interaction.isCommand() || interaction.isUserContextMenuCommand()) {
    // Discord da 3 segundos para responder. La consulta de baneo a la base de datos
    // puede tardar más, así que los comandos de barra se aplazan antes de consultarla.
    // Los comandos vuelven a llamar a deferReply, así que esa segunda llamada no hace nada.
    if (
      interaction.isChatInputCommand() &&
      client.commands.has(interaction.commandName)
    ) {
      const deferred = await interaction
        .deferReply({ withResponse: true })
        .then(() => true)
        .catch(() => false);
      if (!deferred) return;
      interaction.deferReply = async () => {};
    }

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
          const command = interaction.client.commands.get(interaction.commandName);
          const commands = helpList(command.data.toJSON(), client.config.discord.prefix);

          return client.embed(
            {
              title: `❓・Panel de ayuda`,
              desc: `Comandos de \`${names[interaction.commandName] || interaction.commandName}\`, con / o con ${client.config.discord.prefix}\n\n${commands}`,
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
    let data = await verify
      .findOne({ Guild: interaction.guild.id, Channel: interaction.channel.id })
      .lean();
    // Sin configuración guardada: el canal "verificacion" da el rol "USUARIO" (o VERIFY_ROLE del .env)
    if (!data && norm(interaction.channel.name) === "verificacion") {
      const role =
        (process.env.VERIFY_ROLE && interaction.guild.roles.cache.get(process.env.VERIFY_ROLE)) ||
        interaction.guild.roles.cache.find((r) => norm(r.name) === "usuario");
      if (role) data = { Role: role.id };
    }
    if (data) {
      const captcha = createCaptcha();

      try {
        const reply = captcha.image
          ? {
              files: [
                new Discord.AttachmentBuilder(captcha.image, {
                  name: "captcha.jpeg",
                }),
              ],
            }
          : { content: `Escribe este código para verificarte: **${captcha.value}**` };

        interaction
          .reply({ ...reply, withResponse: true })
          .then(function (msg) {
            const filter = (s) => s.author.id == interaction.user.id;

            interaction.channel
              .awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
              .then((response) => {
                if (response.first().content.trim().toUpperCase() === captcha.value) {
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
                  verifyUser?.roles.add(data.Role).catch(() => {});
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
                        msgError?.delete().catch(() => {});
                      }, 2000);
                    });
                }
              })
              .catch(() => {
                // Se acabó el tiempo sin respuesta
                msg.resource?.message?.delete().catch(() => {});
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
