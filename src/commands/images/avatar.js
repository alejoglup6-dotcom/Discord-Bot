/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const user = interaction.options.getUser("user") || interaction.user;

  client.embed(
    {
      title: `🖼・Avatar del usuario`,
      image: user.displayAvatarURL({ dynamic: false, size: 1024 }),
      type: "editreply",
    },
    interaction,
  );
};
