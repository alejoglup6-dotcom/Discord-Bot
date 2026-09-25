const Discord = require("discord.js");

const Schema = require("../../database/models/reactionRoles");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const category = interaction.options.getString("category");
  const role = interaction.options.getRole("role");
  const emoji = interaction.options.getString("emoji");

  const parsedEmoji = Discord.parseEmoji(emoji);
  if (!parsedEmoji)
    return client.errNormal(
      {
        error: `¡No se encontró el emoji en este servidor!`,
        type: "editreply",
      },
      interaction,
    );

  Schema.findOne({ Guild: interaction.guild.id, Category: category }).then(
    async (data) => {
      if (data) {
        data.Roles[emoji] = [
          role.id,
          {
            id: parsedEmoji.id,
            raw: emoji,
          },
        ];

        await Schema.findOneAndUpdate(
          { Guild: interaction.guild.id, Category: category },
          data,
        );
      } else {
        new Schema({
          Guild: interaction.guild.id,
          Message: 0,
          Category: category,
          Roles: {
            [emoji]: [
              role.id,
              {
                id: parsedEmoji.id,
                raw: emoji,
              },
            ],
          },
        }).save();
      }

      client.succNormal(
        {
          text: "¡Rol por reacción creado correctamente! Crea un panel de la siguiente forma",
          fields: [
            {
              name: `📘┆Panel con menú`,
              value: `\`/reactionroles menu [nombre de la categoría]\``,
              inline: true,
            },
            {
              name: `📘┆Panel con botones`,
              value: `\`/reactionroles button [nombre de la categoría]\``,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    },
  );
};
