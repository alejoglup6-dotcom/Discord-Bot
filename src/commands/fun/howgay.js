/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  var result = Math.ceil(Math.random() * 100);

  client.embed(
    {
      title: `🏳️‍🌈・Nivel gay`,
      desc: `¡Eres ${result}% gay!`,
      type: "editreply",
    },
    interaction,
  );
};
