const Discord = require("discord.js");
const Schema = require("../../database/models/customCommandAdvanced");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const cmdname = interaction.options.getString("command");
  const cmdresponce = interaction.options.getString("text");

  Schema.findOne({
    Guild: interaction.guild.id,
    Name: cmdname.toLowerCase(),
  }).then(async (data) => {
    if (data) {
      client.errNormal(
        {
          error: "¡Este nombre de comando ya está en los comandos personalizados del servidor!",
          type: "editreply",
        },
        interaction,
      );
    } else {
      const row = new Discord.ActionRowBuilder().addComponents(
        new Discord.StringSelectMenuBuilder()
          .setCustomId("customSelect")
          .setPlaceholder("❌┆Nada seleccionado")
          .addOptions([
            {
              label: `Embed`,
              description: `Envía un mensaje dentro de un embed`,
              value: "command-embed",
            },
            {
              label: `Normal`,
              description: `Envía el mensaje de forma normal`,
              value: "command-normal",
            },
            {
              label: `Privado`,
              description: `Envía el mensaje por MD`,
              value: "command-dm",
            },
          ]),
      );

      client.embed(
        {
          desc: `¿Qué acción debe tener este comando?`,
          components: [row],
          type: "editreply",
        },
        interaction,
      );

      const filter = (i) => i.user.id === interaction.user.id;

      interaction.channel
        .awaitMessageComponent({ filter, max: 1 })
        .then(async (i) => {
          if (i.customId == "customSelect") {
            await i.deferUpdate();
            if (i.values[0] === "command-embed") {
              new Schema({
                Guild: interaction.guild.id,
                Name: cmdname.toLowerCase(),
                Responce: cmdresponce,
                Action: "Embed",
              }).save();

              client.succNormal(
                {
                  text: `El comando se añadió correctamente`,
                  fields: [
                    {
                      name: "🔧┆Comando",
                      value: `\`\`\`${cmdname.toLowerCase()}\`\`\``,
                      inline: true,
                    },
                  ],
                  components: [],
                  type: "editreply",
                },
                i,
              );
            }

            if (i.values[0] === "command-normal") {
              new Schema({
                Guild: interaction.guild.id,
                Name: cmdname.toLowerCase(),
                Responce: cmdresponce,
                Action: "Normal",
              }).save();

              client.succNormal(
                {
                  text: `El comando se añadió correctamente`,
                  fields: [
                    {
                      name: "🔧┆Comando",
                      value: `\`\`\`${cmdname.toLowerCase()}\`\`\``,
                      inline: true,
                    },
                  ],
                  components: [],
                  type: "editreply",
                },
                i,
              );
            }

            if (i.values[0] === "command-dm") {
              new Schema({
                Guild: interaction.guild.id,
                Name: cmdname.toLowerCase(),
                Responce: cmdresponce,
                Action: "DM",
              }).save();

              client.succNormal(
                {
                  text: `El comando se añadió correctamente`,
                  fields: [
                    {
                      name: "🔧┆Comando",
                      value: `\`\`\`${cmdname.toLowerCase()}\`\`\``,
                      inline: true,
                    },
                  ],
                  components: [],
                  type: "editreply",
                },
                i,
              );
            }

            await interaction.guild.commands.create({
              name: cmdname,
              description: "Comando personalizado del servidor",
            });
          }
        });
    }
  });
};
