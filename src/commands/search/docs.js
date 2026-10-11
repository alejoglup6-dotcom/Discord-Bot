// djsdocs.sorta.moe (la busqueda de antes) ya no existe: se enlaza la pagina de la documentacion de discord.js.
/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const name = String(interaction.options.getString("name") || "").trim();
  if (!/^[A-Za-z][\w.#]*$/.test(name)) {
    return client.errNormal({ error: "Escribe el nombre de una clase o función de discord.js (ej. Client, GuildMember, EmbedBuilder).", type: "editreply" }, interaction);
  }
  const [clase, miembro] = name.split(/[.#]/);
  const base = `https://discord.js.org/docs/packages/discord.js/stable/${encodeURIComponent(clase)}:Class`;
  return client.embed(
    {
      title: `📖・discord.js: ${name}`,
      desc: `[Abrir la documentación de **${clase}**](${miembro ? `${base}#${encodeURIComponent(miembro)}` : base})\n\nSi no es una clase, búscala en [discord.js.org](https://discord.js.org/docs/packages/discord.js/stable).`,
      type: "editreply",
    },
    interaction,
  );
};
