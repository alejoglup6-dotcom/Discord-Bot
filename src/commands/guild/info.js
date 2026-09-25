const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let verifLevels = {
    0: "Ninguno",
    1: "Bajo",
    2: "Medio",
    3: "(╯°□°）╯︵  ┻━┻",
    4: "┻━┻ミヽ(ಠ益ಠ)ノ彡┻━┻",
  };

  let region = {
    brazil: `:flag_br: `,
    "eu-central": `:flag_eu: `,
    singapore: `:flag_sg: `,
    "us-central": `:flag_us: `,
    sydney: `:flag_au: `,
    "us-east": `:flag_us: `,
    "us-south": `:flag_us: `,
    "us-west": `:flag_us: `,
    "eu-west": `:flag_eu: `,
    "vip-us-east": `:flag_us: `,
    europe: `:flag_gb:`,
    amsterdam: `:flag_nl:`,
    hongkong: `:flag_hk: `,
    russia: `:flag_ru: `,
    southafrica: `:flag_za: `,
  };

  let tier = {
    0: "Ninguno",
    1: "NIVEL 1",
    2: "NIVEL 2",
    3: "**NIVEL 3**",
  };

  const members = await interaction.guild.members.fetch();

  client.embed(
    {
      title: `ℹ️・Información del servidor`,
      desc: `Información sobre el servidor ${interaction.guild.name}`,
      thumbnail: interaction.guild.iconURL({ dynamic: true, size: 1024 }),
      image: interaction.guild.bannerURL({ size: 1024 }),
      fields: [
        {
          name: "Nombre del servidor:",
          value: `${interaction.guild.name}`,
          inline: true,
        },
        {
          name: "ID del servidor:",
          value: `${interaction.guild.id}`,
          inline: true,
        },
        {
          name: "Dueño: ",
          value: `<@!${interaction.guild.ownerId}>`,
          inline: true,
        },
        {
          name: "Nivel de verificación: ",
          value: `${verifLevels[interaction.guild.verificationLevel]}`,
          inline: true,
        },
        {
          name: "Nivel de boost: ",
          value: `${tier[interaction.guild.premiumTier]}`,
          inline: true,
        },
        {
          name: "Cantidad de boosts:",
          value: `${interaction.guild.premiumSubscriptionCount || "0"} boosts`,
          inline: true,
        },
        {
          name: "Creado el:",
          value: `<t:${Math.round(interaction.guild.createdTimestamp / 1000)}>`,
          inline: true,
        },
        {
          name: "Miembros:",
          value: `¡${interaction.guild.memberCount} miembros!`,
          inline: true,
        },
        {
          name: "Bots:",
          value: `¡${members.filter((member) => member.user.bot).size} bots!`,
          inline: true,
        },
        {
          name: "Canales de texto: ",
          value: `¡${interaction.guild.channels.cache.filter((channel) => channel.type === Discord.ChannelType.GuildText).size} canales!`,
          inline: true,
        },
        {
          name: "Canales de voz:",
          value: `¡${interaction.guild.channels.cache.filter((channel) => channel.type === Discord.ChannelType.GuildVoice).size} canales!`,
          inline: true,
        },
        {
          name: "Canales de escenario:",
          value: `¡${interaction.guild.channels.cache.filter((channel) => channel.type === Discord.ChannelType.GuildStageVoice).size} canales!`,
          inline: true,
        },
        {
          name: "Canales de anuncios:",
          value: `¡${interaction.guild.channels.cache.filter((channel) => channel.type === Discord.ChannelType.GuildAnnouncement).size} canales!`,
          inline: true,
        },
        {
          name: "Hilos públicos:",
          value: `¡${interaction.guild.channels.cache.filter((channel) => channel.type === Discord.ChannelType.PublicThread).size} hilos!`,
          inline: true,
        },
        {
          name: "Hilos privados:",
          value: `¡${interaction.guild.channels.cache.filter((channel) => channel.type === Discord.ChannelType.PrivateThread).size} hilos!`,
          inline: true,
        },
        {
          name: "Roles:",
          value: `¡${interaction.guild.roles.cache.size} roles!`,
          inline: true,
        },
        {
          name: "Cantidad de emojis:",
          value: `${interaction.guild.emojis.cache.size} emojis`,
          inline: true,
        },
        {
          name: "Cantidad de stickers:",
          value: `${interaction.guild.stickers.cache.size} stickers`,
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
