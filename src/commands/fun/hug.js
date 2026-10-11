const { pedirJson, errorApi } = require("../../assets/utils/apiExterna");

// some-random-api ya no tiene /animu/hug (404): se usa nekos.best (gifs de anime, pide User-Agent)
/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const user = interaction.options.getUser("user");
  if (!user) return client.errUsage({ usage: "hug [mencionar usuario]", type: "editreply" }, interaction);

  try {
    const data = await pedirJson("https://nekos.best/api/v2/hug");
    const gif = data && data.results && data.results[0] && data.results[0].url;
    if (!gif) throw new Error("el servicio externo no mandó el gif");
    return client.embed({ title: `${interaction.user.tag} abraza a ${user.tag}`, image: gif, type: "editreply" }, interaction);
  } catch (e) {
    return errorApi(client, interaction, e, "el gif");
  }
};
