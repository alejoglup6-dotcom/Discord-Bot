/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  var result = Math.ceil(Math.random() * 100);

  client.embed(
    {
      title: `👀・Nivel de simp`,
      desc: `¡Eres ${result}% simp!`,
      type: "editreply",
    },
    interaction,
  );
};
