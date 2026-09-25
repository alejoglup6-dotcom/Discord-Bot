/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const user1 = interaction.options.getUser("user1");
  const user2 = interaction.options.getUser("user2");

  if (!user1 || !user2)
    return client.errUsage(
      { usage: "lovemeter [usuario1]", type: "editreply" },
      interaction,
    );

  if (user1 == user2)
    return client.errNormal(
      { error: "¡No puedes poner dos veces el mismo nombre!", type: "editreply" },
      interaction,
    );

  var result = Math.ceil(Math.random() * 100);

  client.embed(
    {
      title: `${client.emotes.normal.heart}・Medidor de amor`,
      desc: "¡Mira cuánto encajan!",
      fields: [
        {
          name: "Nombre 1",
          value: `${user1}`,
          inline: true,
        },
        {
          name: "Nombre 2",
          value: `${user2}`,
          inline: true,
        },
        {
          name: "Resultado",
          value: `**${user2}** y **${user2}** son compatibles en un **${result}%**`,
          inline: false,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
};
