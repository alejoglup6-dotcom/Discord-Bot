const Discord = require("discord.js");

const Schema = require("../../database/models/ticketMessage");

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

  const type = interaction.options.getString("type");
  const message = interaction.options.getString("message");

  if (type == "open") {
    if (message.toUpperCase() == "DEFAULT") {
      const data = await Schema.findOne({ Guild: interaction.guild.id });

      if (data) {
        data.openTicket =
          "¡Gracias por crear un ticket! \nEl equipo de soporte te atenderá en breve \n\n🔒 - Cerrar ticket \n✋ - Reclamar ticket \n📝 - Guardar transcripción \n🔔 - Enviar una notificación";
        data.save();

        client.succNormal(
          {
            text: `El mensaje del ticket se guardó correctamente`,
            fields: [
              {
                name: `📘┆Tipo de mensaje`,
                value: `${type}`,
                inline: true,
              },
              {
                name: `💬┆Mensaje`,
                value: `${data.openTicket}`,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      } else {
        client.errNormal(
          {
            error: `¡No se encontraron datos del mensaje de ticket!`,
            type: "editreply",
          },
          interaction,
        );
      }

      return;
    }

    Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
      if (data) {
        data.openTicket = message;
        data.save();
      } else {
        new Schema({
          Guild: interaction.guild.id,
          openTicket: message,
        }).save();
      }
    });

    client.succNormal(
      {
        text: `El mensaje del ticket se guardó correctamente`,
        fields: [
          {
            name: `📘┆Tipo de mensaje`,
            value: `${type}`,
            inline: true,
          },
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
  } else if (type == "close") {
    if (message.toUpperCase() == "DEFAULT") {
      const data = await Schema.findOne({ Guild: interaction.guild.id });

      if (data) {
        data.dmMessage =
          "Aquí tienes la transcripción de tu ticket. ¡Guárdala por si alguna vez necesitas consultarla!";
        data.save();

        client.succNormal(
          {
            text: `El mensaje del ticket se guardó correctamente`,
            fields: [
              {
                name: `📘┆Tipo de mensaje`,
                value: `${type}`,
                inline: true,
              },
              {
                name: `💬┆Mensaje`,
                value: `${data.dmMessage}`,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      } else {
        client.errNormal(
          {
            error: `¡No se encontraron datos del mensaje de ticket!`,
            type: "editreply",
          },
          interaction,
        );
      }

      return;
    }

    Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
      if (data) {
        data.dmMessage = message;
        data.save();
      } else {
        new Schema({
          Guild: interaction.guild.id,
          dmMessage: message,
        }).save();
      }
    });

    client.succNormal(
      {
        text: `El mensaje del ticket se guardó correctamente`,
        fields: [
          {
            name: `📘┆Tipo de mensaje`,
            value: `${type}`,
            inline: true,
          },
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
  }
};
