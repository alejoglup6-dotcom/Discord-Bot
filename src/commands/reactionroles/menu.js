const Discord = require("discord.js");

const Schema = require("../../database/models/reactionRoles");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const category = interaction.options.getString("category");
  const channel =
    interaction.options.getChannel("channel") || interaction.channel;

  const lower = category.toLowerCase();
  const upper = lower.charAt(0).toUpperCase() + lower.substring(1);

  Schema.findOne({ Guild: interaction.guild.id, Category: category }).then(
    async (data) => {
      if (!data)
        return client.errNormal(
          {
            error: `¡No se encontraron datos!`,
            type: "editreply",
          },
          interaction,
        );

      const map = Object.keys(data.Roles)
        .map((value, index) => {
          const role = interaction.guild.roles.cache.get(data.Roles[value][0]);
          if (!role) return;

          return `${data.Roles[value][1].raw} | ${role}`;
        })
        .join("\n");

      const menu = new Discord.StringSelectMenuBuilder()
        .setCustomId("reaction_select")
        .setPlaceholder("❌┇Nada seleccionado")
        .setMinValues(1);

      var labels = [];

      const mapped = Object.keys(data.Roles)
        .map((value, index) => {
          const role = interaction.guild.roles.cache.get(data.Roles[value][0]);
          if (!role) return;

          const generated = {
            label: `${role.name}`,
            description: `Añade o quita el rol ${role.name}`,
            emoji: data.Roles[value][1].raw,
            value: data.Roles[value][1].raw,
          };

          return labels.push(generated);
        })
        .join("\n");

      await menu.addOptions(labels);

      const row = new Discord.ActionRowBuilder().addComponents(menu);

      client
        .embed(
          {
            title: `${upper}・Roles`,
            desc: `_____ \n\n¡Elige tus roles en el menú! \n\n${map}`,
            components: [row],
          },
          channel,
        )
        .then(async (msg) => {
          if (!msg) {
            client.errNormal(
              {
                error:
                  "¡No pude enviar el mensaje!\n¡Asegúrate de que tengo los permisos correctos!",
                type: "editreply",
              },
              interaction,
            );
            return;
          }
          data.Message = msg.id;
          data.save();
        });

      client.succNormal(
        {
          text: "¡Panel de reacciones creado correctamente!",
          type: "ephemeraledit",
        },
        interaction,
      );
    },
  );
};
