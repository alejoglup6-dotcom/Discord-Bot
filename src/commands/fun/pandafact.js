const { pedirJson, errorApi } = require("../../assets/utils/apiExterna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  try {
    const json = await pedirJson("https://some-random-api.com/facts/panda");
    if (!json || !json.fact) throw new Error("el servicio externo no mandó el dato");
    return client.embed({ title: `💡・Dato aleatorio sobre pandas`, desc: json.fact, type: "editreply" }, interaction);
  } catch (e) {
    return errorApi(client, interaction, e, "un dato sobre pandas");
  }
};
