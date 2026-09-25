/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  var result = Math.ceil(Math.random() * 100);

  client.embed(
    {
      title: `🎮・Nivel de gamer épico`,
      desc: `¡Eres ${result}% gamer épico!`,
      type: "editreply",
    },
    interaction,
  );
};
