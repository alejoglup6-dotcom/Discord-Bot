const Discord = require("discord.js");
const moment = require("moment");
require("moment-duration-format");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const promises = [
    client.shard.broadcastEval((client) => client.guilds.cache.size),
    client.shard.broadcastEval((client) =>
      client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
    ),
    client.shard.broadcastEval((client) => client.channels.cache.size),
    client.shard.broadcastEval((client) => client.voice.adapters.size),
  ];
  return Promise.all(promises).then(async (results) => {
    const totalGuilds = results[0].reduce(
      (acc, guildCount) => acc + guildCount,
      0,
    );
    const totalMembers = results[1].reduce(
      (acc, memberCount) => acc + memberCount,
      0,
    );
    const totalChannels = results[2].reduce(
      (acc, channelCount) => acc + channelCount,
      0,
    );
    const totalVoice = results[3].reduce(
      (acc, voiceCount) => acc + voiceCount,
      0,
    );

    const duration = moment
      .duration(client.uptime)
      .format("\`D\` [days], \`H\` [hrs], \`m\` [mins], \`s\` [secs]");

    client.embed(
      {
        title: `ℹ・Información del bot`,
        desc: `____________________________`,
        thumbnail: client.user.avatarURL({ size: 1024 }),
        fields: [
          {
            name: "ℹ️┆Información",
            value: `¡Bot es un bot con el que puedes gestionar todo tu servidor! Con más de 350 comandos, es un bot enorme con muchas opciones para mejorar tu servidor.`,
            inline: false,
          },
          {
            name: "_____ \n\n│General",
            value: `_____`,
            inline: false,
          },
          {
            name: "🤖┆Nombre del bot",
            value: `${client.user.username}`,
            inline: true,
          },
          {
            name: "🆔┆ID del bot",
            value: `${client.user.id}`,
            inline: true,
          },
          {
            name: "💻┆Shards",
            value: `\`${client.options.shardCount}\` shards`,
            inline: true,
          },
          {
            name: "🔧┆Dueño del bot",
            value: `Drok`,
            inline: true,
          },
          {
            name: "🔧┆Desarrollador del bot",
            value: `Drok`,
            inline: true,
          },
          {
            name: "💻┆Comandos",
            value: `\`${client.commands.size}\` comandos`,
            inline: true,
          },
          {
            name: "🌐┆Servidores",
            value: `\`${totalGuilds}\` servidores`,
            inline: true,
          },
          {
            name: "🌐┆Servidores en este shard",
            value: `\`${client.guilds.cache.size}\` servidores`,
            inline: true,
          },
          {
            name: "👥┆Miembros",
            value: `\`${totalMembers}\` miembros`,
            inline: true,
          },
          {
            name: "🔊┆Canales conectados",
            value: `\`${totalVoice}\` canales`,
            inline: true,
          },
          {
            name: "📺┆Canales",
            value: `\`${totalChannels}\` canales`,
            inline: true,
          },
          {
            name: "📅┆Creado",
            value: `<t:${Math.round(client.user.createdTimestamp / 1000)}>`,
            inline: true,
          },

          {
            name: "_____ \n\n│Sistema",
            value: `_____`,
            inline: false,
          },
          {
            name: "🆙┆Tiempo activo",
            value: `${duration}`,
            inline: true,
          },
          {
            name: "⌛┆Velocidad de la API:",
            value: `\`${client.ws.ping}\`ms`,
            inline: true,
          },
          {
            name: "🏷┆Versión del bot",
            value: `\`${require(`${process.cwd()}/package.json`).version}\``,
            inline: true,
          },
          {
            name: "🏷┆Versión de Node.js",
            value: `\`${process.version}\``,
            inline: true,
          },
          {
            name: "📂┆Versión de Discord.js",
            value: `\`${Discord.version}\``,
            inline: true,
          },
          {
            name: "💾┆Memoria del bot",
            value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}\` MB`,
            inline: true,
          },
          {
            name: "🔗┆Enlaces",
            value: `Añádeme: [[AQUÍ]](${client.config.discord.botInvite}) \nServidor de soporte: [[AQUÍ]](${client.config.discord.serverInvite})`,
            inline: false,
          },
        ],
        type: "editreply",
      },
      interaction,
    );
  });
};
