const { pedirJson, errorApi } = require("../../assets/utils/apiExterna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  try {
    const json = await pedirJson("https://some-random-api.com/img/dog");
    if (!json || !json.link) throw new Error("el servicio externo no mandó la imagen");
    return client.embed({ title: `🐶・Perro aleatorio`, image: json.link, type: "editreply" }, interaction);
  } catch (e) {
    return errorApi(client, interaction, e, "un perro");
  }
};
