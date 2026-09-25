const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const question = interaction.options.getString("question");

  var antwoorden = [
    "¡Sí!",
    "Por desgracia, no",
    "¡Tienes toda la razón!",
    "No, lo siento.",
    "Estoy de acuerdo",
    "¡Ni idea!",
    "No soy tan listo ..",
    "¡Mis fuentes dicen que no!",
    "Es seguro",
    "Puedes contar con ello",
    "Probablemente no",
    "Todo apunta a que no",
    "Sin duda",
    "Por supuesto",
    "No lo sé",
  ];
  var resultaat = Math.floor(Math.random() * antwoorden.length);

  client.embed(
    {
      title: `${client.emotes.normal.ball}・8ball`,
      desc: `¡Mira la respuesta a tu pregunta!`,
      fields: [
        {
          name: `💬┆Tu pregunta`,
          value: `\`\`\`${question}\`\`\``,
          inline: false,
        },
        {
          name: `🤖┆Respuesta del bot`,
          value: `\`\`\`${antwoorden[resultaat]}\`\`\``,
          inline: false,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
