const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const row = new Discord.ActionRowBuilder().addComponents(
    new Discord.StringSelectMenuBuilder()
      .setCustomId("Bot-linkspanel")
      .setPlaceholder("❌┆Nada seleccionado")
      .addOptions([
        {
          label: `Servidor de soporte`,
          description: `Únete al servidor de soporte`,
          emoji: "❓",
          value: "support-linkspanel",
        },
        {
          label: `Invitar al bot`,
          description: `Invita al bot a tu servidor`,
          emoji: "📨",
          value: "invite-linkspanel",
        },
        {
          label: `Servidor de la comunidad`,
          description: `¡Únete al servidor de la comunidad!`,
          emoji: "🌍",
          value: "community-linkspanel",
        },
        {
          label: `Top.gg`,
          description: `Muestra el enlace de top.gg`,
          emoji: "📃",
          value: "top.gg-linkspanel",
        },
      ]),
  );

  client.embed(
    {
      title: `🔗・Enlaces`,
      desc: `¡Accede a todos los enlaces del bot! Elige el enlace que necesitas en el menú de abajo`,
      image:
        "https://cdn.discordapp.com/attachments/843487478881976381/874694194474668052/Bot_banner_invite.jpg",
      components: [row],
      type: "editreply",
    },
    interaction,
  );
};
