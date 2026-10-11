const { gifAccion } = require("../../assets/utils/gifs");

// El gif sale de varias páginas en orden (src/assets/utils/gifs.js): si una bloquea al bot, se usa la siguiente
/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const user = interaction.options.getUser("user");
  if (!user) return client.errUsage({ usage: "hug [mencionar usuario]", type: "editreply" }, interaction);

  try {
    const gif = await gifAccion("hug");
    return client.embed({ title: `${interaction.user.username} abraza a ${user.username}`, image: gif, type: "editreply" }, interaction);
  } catch (e) {
    console.log(`[gifs] hug: ${e.message}`);
    return client.errNormal({ error: "No pude traer el gif: las páginas de gifs no contestan ahora. Prueba de nuevo en un rato.", type: "editreply" }, interaction);
  }
};
