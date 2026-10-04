const samp = require("../../database/samp");
const { WARN_DAYS } = require("../../assets/data/rangos");

/**
 * Advertencia, como /adv en el juego (bad_history). Con 1, 2 o 3 se pone el rol ⚠️ ADVERTENCIA 1, 2 o 3.
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const me = await client.samp.admin(interaction, "advertir");
  if (!me) return;
  const target = await client.samp.target(interaction, me);
  if (!target) return;

  const reason = client.samp.reason(interaction);
  const n = await samp.warn(target, me, reason);

  client.succNormal(
    {
      text: `**${client.samp.name(target.name)}** advertido: lleva **${n}/3**${n >= 3 ? " — hay que decidir la sanción" : ""}`,
      fields: [
        { name: "📄┆Razón", value: reason, inline: true },
        { name: "⏰┆Duración", value: `Cuentan las de los últimos ${WARN_DAYS} días`, inline: true },
      ],
      type: "editreply",
    },
    interaction,
  );
};
