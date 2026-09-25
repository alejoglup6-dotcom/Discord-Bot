const Discord = require("discord.js");
const axios = require("axios");

const model = require("../../database/models/badge");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const invite = interaction.options.getString("invite");

  const verifyFlags = {
    0: `Sin restricciones`,
    1: `Debe tener un correo verificado en la cuenta`,
    2: `Debe llevar más de 5 minutos registrado en Discord`,
    3: `Debe llevar más de 10 minutos como miembro del servidor`,
    4: `Debe tener un número de teléfono verificado`,
  };

  axios
    .get(`https://discord.com/api/v9/invites/${encodeURIComponent(invite)}`)
    .catch(async () => {
      return client.errNormal(
        {
          error: "No pude encontrar el servidor",
          type: "editreply",
        },
        interaction,
      );
    })
    .then(async (raw) => {
      const { data } = raw;
      if (!data) return;

      let guildTimestamp = (await toUnix(data.guild.id)).timestamp;
      let channelTimestamp = (await toUnix(data.channel.id)).timestamp;

      return client.embed(
        {
          title: `📨・Información de la invitación`,
          thumbnail: `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png?size=1024`,
          image: `https://cdn.discordapp.com/banners/${data.guild.id}/${data.guild.banner}.png?size=1024`,
          fields: [
            {
              name: "Nombre del servidor",
              value: `${data.guild.name}`,
              inline: true,
            },
            {
              name: "ID del servidor",
              value: `${data.guild.id}`,
              inline: true,
            },
            {
              name: "Servidor creado",
              value: `<t:${guildTimestamp}>`,
              inline: true,
            },
            {
              name: "Nombre del canal",
              value: `${data.channel.name}`,
              inline: true,
            },
            {
              name: "ID del canal",
              value: `${data.channel.id}`,
              inline: true,
            },
            {
              name: "Canal creado",
              value: `<t:${channelTimestamp}>`,
              inline: true,
            },
            {
              name: "Imágenes del servidor",
              value: `${data.guild.icon && data.guild.banner && data.guild.splash ? `` : `Sin datos`}
          ${data.guild.icon ? `[Icono del servidor](https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png?size=4096)` : ``}
          ${data.guild.banner ? `[Banner del servidor](https://cdn.discordapp.com/banners/${data.guild.id}/${data.guild.banner}.png?size=4096)` : ``}`,
              inline: true,
            },
            {
              name: "Nivel de verificación del servidor",
              value: `${verifyFlags[data.guild.verification_level]}`,
              inline: true,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    });
};

const toUnix = (snowflake) => {
  const EPOCH = 1420070400000;
  const BINARY = idToBinary(snowflake.toString()).toString(2).padStart(64, "0");
  let timestamp = parseInt(
    (parseInt(BINARY.substring(0, 42), 2) + EPOCH)
      .toString()
      .substring(
        0,
        (parseInt(BINARY.substring(0, 42), 2) + EPOCH).toString().length - 3,
      ),
  );
  let timestampms = parseInt(BINARY.substring(0, 42), 2) + EPOCH;
  const date = new Date(timestampms);
  const data = {
    timestamp,
    timestampms,
    date,
  };
  return data;
};

const idToBinary = (num) => {
  let bin = "";
  let high = parseInt(num.slice(0, -10)) || 0;
  let low = parseInt(num.slice(-10));
  while (low > 0 || high > 0) {
    bin = String(low & 1) + bin;
    low = Math.floor(low / 2);
    if (high > 0) {
      low += 5000000000 * (high % 2);
      high = Math.floor(high / 2);
    }
  }
  return bin;
};
