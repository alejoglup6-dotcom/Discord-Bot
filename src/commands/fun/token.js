const crypto = require("crypto");

// La API de antes (some-random-api.com/bottoken) ya no existe: el "token" de broma se arma aqui, con el mismo formato que
// un token de bot (id en base64 . marca de tiempo . firma). No es un token real.
const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const token = `${b64url(interaction.user.id)}.${b64url(crypto.randomBytes(4))}.${b64url(crypto.randomBytes(27))}`;
  return client.embed({ title: `🤖・Token del bot`, desc: `\`${token}\`\n\n*Es de broma: no es un token real.*`, type: "editreply" }, interaction);
};
