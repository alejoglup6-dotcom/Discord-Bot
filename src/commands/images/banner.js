/**
 * Banner del usuario (o su color de acento si no tiene). Se pide a Discord con discord.js (force: el banner no viene en caché).
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const user = interaction.options.getUser("user") || interaction.user;

  let full;
  try {
    full = await client.users.fetch(user.id, { force: true });
  } catch (e) {
    console.log(`[images] banner: ${e.message}`);
    return client.errNormal({ error: "No pude consultar el perfil ahora. Prueba de nuevo en un rato.", type: "editreply" }, interaction);
  }

  const url = full.bannerURL({ size: 1024 });
  if (url) return client.embed({ title: `🖼・Banner del usuario`, image: url, type: "editreply" }, interaction);
  if (full.accentColor) {
    return client.embed(
      { title: `🖼・Banner del usuario`, desc: `${user} no tiene banner, pero sí un color de acento: \`#${full.accentColor.toString(16).padStart(6, "0")}\``, color: full.accentColor, type: "editreply" },
      interaction,
    );
  }
  return client.embed({ title: `🖼・Banner del usuario`, desc: `${user} no tiene banner.`, type: "editreply" }, interaction);
};
