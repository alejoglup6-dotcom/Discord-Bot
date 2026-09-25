/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const image = interaction.options.getString("image-url");
  const channel = interaction.options.getChannel("channel");

  if (!channel)
    return client.errNormal(
      { error: `No se encontró el canal`, type: "editreply" },
      interaction,
    );

  client.succNormal(
    {
      text: `La imagen se envió correctamente a ${channel}`,
      type: "editreply",
    },
    interaction,
  );

  client.simpleEmbed(
    {
      image: `${image}`,
    },
    channel,
  );
};
