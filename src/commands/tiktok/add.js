const tiktokCreators = require("../../database/models/tiktokCreators");

/**
 * Agrega un creador a la lista del servidor y lo lee en el momento (sin reiniciar el bot).
 * Si ya estaba y se indica miembro, solo se actualiza su cuenta de Discord.
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const tools = client.tiktokTools;
  if (!tools) {
    return client.errNormal({ error: "El módulo de TikTok no está cargado en el bot.", type: "editreply" }, interaction);
  }

  const user = tools.normalizeCreator(interaction.options.getString("user"));
  if (!user) {
    return client.errNormal({ error: "Ese usuario de TikTok no es válido. Ejemplo: /tiktok add user:@usuario", type: "editreply" }, interaction);
  }
  if (user === tools.mainUser.toLowerCase()) {
    return client.errNormal({ error: `@${user} es la cuenta del servidor: sus videos ya se avisan todos, no hace falta agregarla.`, type: "editreply" }, interaction);
  }
  const member = interaction.options.getUser("miembro");

  const exists = await tiktokCreators.findOne({ Guild: interaction.guild.id, User: user });
  if (exists && member && exists.Member !== member.id) {
    exists.Member = member.id;
    await exists.save();
    return client.succNormal({ text: `@${user} ya estaba en la lista: ahora sus avisos muestran a ${member}.`, type: "editreply" }, interaction);
  }
  if (exists || tools.envCreators.includes(user)) {
    return client.errNormal({ error: `@${user} ya está en la lista.`, type: "editreply" }, interaction);
  }

  // Comprueba que la cuenta exista y sea pública antes de guardarla
  let profile;
  try {
    profile = await tools.verifyCreator(user);
  } catch (e) {
    return client.errNormal(
      { error: `No pude leer a @${user}: ${e.message}. Revisa que esté bien escrito y que la cuenta sea pública.`, type: "editreply" },
      interaction,
    );
  }

  await new tiktokCreators({ Guild: interaction.guild.id, User: user, Member: member ? member.id : undefined, AddedBy: interaction.user.id, Date: Date.now() }).save();

  // Lectura inmediata de ese creador
  const r = await client.checkTikTokMentions({ only: [user] });

  let detail;
  if (r.skipped) detail = "El aviso de menciones está apagado (TIKTOK_MENTIONS=0) o ya había una lectura en curso; se leerá en la próxima vuelta.";
  else if (!r.read) detail = "Se guardó, pero esta vez TikTok no me dejó leer sus videos; se reintenta en la próxima vuelta (cada 10 min).";
  else if (!r.scanned) detail = "Todavía no tiene videos públicos: se avisarán cuando suba alguno que mencione a la cuenta.";
  else detail = `Leí ${r.scanned} videos recientes: ${r.matched} mencionan a @${tools.mainUser}, ${r.posted} publicados ahora en el canal de TikTok.`;

  const name = profile && profile.info && profile.info.nickname ? ` (${profile.info.nickname})` : "";
  return client.succNormal(
    {
      text: `Agregué a **@${user}**${name}${member ? ` · ${member}` : ""}. A partir de ahora se avisan sus videos que mencionen a @${tools.mainUser}.`,
      fields: [{ name: "🎵┆Lectura", value: detail }],
      type: "editreply",
    },
    interaction,
  );
};
