const fortuna = require("../../database/fortuna");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const r = await fortuna.contract(interaction.guild.id, interaction.user.id, interaction.options.getString("job"));

  if (r.error === "no_job") return client.errNormal({ error: "Ese oficio no existe. Mira /fortuna trabajos", type: "editreply" }, interaction);
  if (r.error === "same_job") return client.errNormal({ error: `Ya trabajas de ${r.job.name}`, type: "editreply" }, interaction);
  if (r.error === "has_job")
    return client.errNormal({ error: `Ya trabajas de ${r.job.name}. Renuncia primero con /fortuna renunciar`, type: "editreply" }, interaction);
  if (r.error === "needs")
    return client.errNormal(
      { error: `Para ser ${r.job.name} necesitas tener: ${r.missing.map((c) => c.name.toLowerCase()).join(", ")}`, type: "editreply" },
      interaction,
    );

  client.succNormal(
    { text: `${r.job.emoji} Firmaste el contrato de **${r.job.name}**. Trabaja con \`/fortuna trabajar\` o \`!trabajar\``, type: "editreply" },
    interaction,
  );
};
