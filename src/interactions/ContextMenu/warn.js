const { CommandInteraction, Client } = require("discord.js");
const { ContextMenuCommandBuilder } = require("discord.js");
const Discord = require("discord.js");

const Schema = require("../../database/models/warnings");
const Case = require("../../database/models/warnCase");

module.exports = {
  data: new ContextMenuCommandBuilder().setName("Warn").setType(2),

  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */
  run: async (client, interaction, args) => {
    const perms = await client.checkPerms(
      {
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages],
      },
      interaction,
    );
    if (perms === false) {
      client.errNormal(
        {
          error: `¡No tienes los permisos necesarios para usar este comando!`,
          type: "ephemeral",
        },
        interaction,
      );
      return;
    }
    // Create modal to give a reason
    const modal = new Discord.ModalBuilder()
      .setTitle("Advertir")
      .setCustomId("warn")
      .addComponents(
        new Discord.ActionRowBuilder().addComponents(
          new Discord.TextInputBuilder()
            .setCustomId("reason")
            .setPlaceholder("Razón")
            .setLabel("Razón")
            .setMinLength(1)
            .setStyle(Discord.TextInputStyle.Short)
            .setMaxLength(100),
        ),
      );
    await interaction.showModal(modal);

    const submitted = await interaction
      .awaitModalSubmit({
        time: 60000,
        filter: (i) => i.user.id === interaction.user.id,
      })
      .catch(() => {});

    if (!submitted) {
      return;
    }

    const member = interaction.guild.members.cache.get(interaction.targetId);
    var caseNumber;
    await Case.findOne({ Guild: interaction.guild.id }).then(async (data) => {
      if (!data) {
        new Case({
          Guild: interaction.guild.id,
          Case: 1,
        }).save();
        caseNumber = 1;
      } else {
        data.Case += 1;
        data.save();
        caseNumber = data.Case;
      }
    });

    Schema.findOne({ Guild: interaction.guild.id, User: member.id }).then(
      async (data) => {
        if (data) {
          data.Warnings.push({
            Moderator: interaction.user.id,
            Reason: submitted.fields.getTextInputValue("reason"),
            Date: Date.now(),
            Case: caseNumber,
          });
          data.save();
        } else {
          new Schema({
            Guild: interaction.guild.id,
            User: member.id,
            Warnings: [
              {
                Moderator: interaction.user.id,
                Reason: submitted.fields.getTextInputValue("reason"),
                Date: Date.now(),
                Case: caseNumber,
              },
            ],
          }).save();
        }
      },
    );

    client
      .embed(
        {
          title: `🔨・Advertencia`,
          desc: `Recibiste una advertencia en **${interaction.guild.name}**`,
          fields: [
            {
              name: "👤┆Moderador",
              value: interaction.user.tag,
              inline: true,
            },
            {
              name: "📄┆Razón",
              value: submitted.fields.getTextInputValue("reason"),
              inline: true,
            },
          ],
        },
        member,
      )
      .catch(() => {});

    client.emit(
      "warnAdd",
      member,
      interaction.user,
      submitted.fields.getTextInputValue("reason"),
    );
    client.succNormal(
      {
        text: `¡El usuario recibió una advertencia!`,
        fields: [
          {
            name: "👤┆Usuario",
            value: `${member}`,
            inline: true,
          },
          {
            name: "👤┆Moderador",
            value: `${interaction.user}`,
            inline: true,
          },
          {
            name: "📄┆Razón",
            value: submitted.fields.getTextInputValue("reason"),
            inline: false,
          },
        ],
        type: "ephemeral",
      },
      submitted,
    );
  },
};
