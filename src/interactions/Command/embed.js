const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const { ChannelType } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Genera un embed")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Canal donde debe ir el embed")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText),
    ),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    const perms = await client.checkPerms(
      {
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages],
      },
      interaction,
    );

    if (perms == false) return;

    let row = new Discord.ActionRowBuilder().addComponents(
      new Discord.StringSelectMenuBuilder()
        .setCustomId("embedSelect")
        .setPlaceholder("Nada seleccionado")
        .addOptions([
          {
            emoji: "✏️",
            label: "Título",
            description: "Crea el título del embed",
            value: "title_embed",
          },
          {
            emoji: "💬",
            label: "Descripción",
            description: "Crea la descripción del embed",
            value: "description_embed",
          },
          {
            emoji: "🕵️",
            label: "Autor",
            description: "Crea el autor del embed",
            value: "author_embed",
          },
          {
            emoji: "🔻",
            label: "Pie de página",
            description: "Crea el pie de página del embed",
            value: "footer_embed",
          },
          {
            emoji: "🔳",
            label: "Miniatura",
            description: "Crea la miniatura del embed",
            value: "thumbnail_embed",
          },
          {
            emoji: "🕙",
            label: "Fecha y hora",
            description: "Añade la fecha y hora al embed",
            value: "timestamp_embed",
          },
          {
            emoji: "🖼️",
            label: "Imagen",
            description: "Crea la imagen del embed",
            value: "image_embed",
          },
          {
            emoji: "🌐",
            label: "URL",
            description: "Crea la URL del embed",
            value: "url_embed",
          },
          {
            emoji: "🔵",
            label: "Color",
            description: "Crea el color del embed",
            value: "color_embed",
          },
        ]),
    );

    let row2 = new Discord.ActionRowBuilder().addComponents(
      new Discord.ButtonBuilder()
        .setCustomId("send_embed")
        .setEmoji("✅")
        .setLabel("Enviar embed")
        .setStyle(Discord.ButtonStyle.Success),
    );

    let embed = new Discord.EmbedBuilder().setDescription(
      `Elige algunas opciones`,
    );

    interaction.editReply({ embeds: [embed], components: [row, row2] });

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "embedSelect") {
        i.deferUpdate();

        if (i.values == "title_embed") {
          interaction.channel
            .send({ content: "Escribe un título" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  embed.setTitle(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "description_embed") {
          interaction.channel
            .send({ content: "Escribe una descripción" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  embed.setDescription(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "author_embed") {
          interaction.channel
            .send({ content: "Escribe un autor" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  embed.setAuthor({
                    name: `${collected.first().content}`,
                    iconURL: interaction.guild.iconURL({ size: 1024 }),
                  });
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "footer_embed") {
          interaction.channel
            .send({ content: "Escribe un pie de página" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  embed.setFooter({
                    text: `${collected.first().content}`,
                  });
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "thumbnail_embed") {
          interaction.channel
            .send({ content: "Escribe una miniatura" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  if (
                    !collected.first().content.includes("http://") &&
                    !collected.first().content.includes("https://")
                  )
                    return interaction.channel.send({
                      content: "¡Enlace de la miniatura incorrecto!",
                    });
                  embed.setThumbnail(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "thumbnail_embed") {
          embed.setTimestamp();
          interaction.editReply({ embeds: [embed] });
        }

        if (i.values == "image_embed") {
          interaction.channel
            .send({ content: "Escribe una imagen" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  if (
                    !collected.first().content.includes("http://") &&
                    !collected.first().content.includes("https://")
                  )
                    return interaction.channel.send({
                      content: "¡Enlace de la imagen incorrecto!",
                    });
                  embed.setImage(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "url_embed") {
          interaction.channel
            .send({ content: "Escribe una URL" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  if (
                    !collected.first().content.includes("http://") &&
                    !collected.first().content.includes("https://")
                  )
                    return interaction.channel.send({
                      content: "¡URL incorrecta!",
                    });
                  embed.setURL(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }

        if (i.values == "color_embed") {
          interaction.channel
            .send({ content: "Escribe un color. Ej.: #FF0000" })
            .then((message) => {
              const filterMessage = (m) =>
                m.author.id === interaction.user.id && !m.author.bot;
              interaction.channel
                .awaitMessages({
                  filterMessage,
                  max: 1,
                  time: 300000,
                  errors: ["time"],
                })
                .then(async (collected) => {
                  message.delete({ timeout: 1000 });
                  collected.delete({ timeout: 1000 });

                  embed.setColor(`${collected.first().content}`);
                  await interaction.editReply({ embeds: [embed] });
                });
            });
        }
      }
      if (i.customId == "send_embed") {
        const channel = interaction.options.getChannel("channel");
        if (!channel)
          return client.errNormal(
            { error: `No se encontró el canal` },
            interaction.channel,
          );

        channel
          .createWebhook({
            name: interaction.guild.name,
            avatar: interaction.guild.iconURL(),
          })
          .then(async (_webhook) => {
            await _webhook.send({ embeds: [embed] });

            client.succNormal(
              {
                text: `Embed enviado correctamente en ${channel}`,
                components: [],
                type: "editreply",
              },
              interaction,
            );
            collector.stop();

            setTimeout(() => {
              _webhook.delete();
              i.message.delete();
            }, 5000);
          });
      }
    });
  },
};
