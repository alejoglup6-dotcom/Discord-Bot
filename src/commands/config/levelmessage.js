const Discord = require("discord.js");

const Schema = require("../../database/models/levelMessages");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const perms = await client.checkUserPerms(
    {
      flags: [Discord.PermissionsBitField.Flags.ManageMessages],
      perms: [Discord.PermissionsBitField.Flags.ManageMessages],
    },
    interaction,
  );

  if (perms == false) return;

  const message = interaction.options.getString("message");

  if (message.toUpperCase() == "HELP") {
    return client.embed(
      {
        title: `ℹ️・Opciones del mensaje de nivel`,
        desc: `Estas son las opciones del mensaje de nivel: \n
            \`{user:username}\` - Nombre de usuario
            \`{user:discriminator}\` - Discriminador del usuario
            \`{user:tag}\` - Tag del usuario
            \`{user:mention}\` - Mencionar al usuario

            \`{user:level}\` - Nivel del usuario
            \`{user:xp}\` - XP del usuario`,
        type: "editreply",
      },
      interaction,
    );
  }

  if (message.toUpperCase() == "DEFAULT") {
    Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
      if (data) {
        Schema.findOneAndDelete({ Guild: interaction.guild.id }).then(() => {
          client.succNormal(
            {
              text: `¡Mensaje de nivel eliminado!`,
              type: "editreply",
            },
            interaction,
          );
        });
      }
    });
  } else {
    Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
      if (data) {
        data.Message = message;
        data.save();
      } else {
        new Schema({
          Guild: interaction.guild.id,
          Message: message,
        }).save();
      }

      client.succNormal(
        {
          text: `El mensaje de nivel se guardó correctamente`,
          fields: [
            {
              name: `💬┆Mensaje`,
              value: `${message}`,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    });
  }
};
