const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const roll = [
    "Nunca te voy a abandonar",
    "Nunca te voy a decepcionar",
    "Nunca voy a dar vueltas y dejarte tirado",
    "Nunca te voy a hacer llorar",
    "Nunca te voy a decir adiós",
    "Nunca te voy a mentir ni a hacer daño",
  ];
  const rick = roll[Math.floor(Math.random() * roll.length)];

  client.embed(
    {
      title: `😂・${rick}`,
      image: `https://i.pinimg.com/originals/88/82/bc/8882bcf327896ab79fb97e85ae63a002.gif`,
      type: "editreply",
    },
    interaction,
  );
};
