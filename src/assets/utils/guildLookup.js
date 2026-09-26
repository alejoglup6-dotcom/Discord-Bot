/*
 * Busca canales y roles por su nombre, sin tildes ni emojis ("🎍┆bienvenidas" -> "bienvenidas").
 * Así el bot encuentra solo los canales del servidor (bienvenidas, despedidas, info-fortuna, invitados...)
 * sin tener que configurarlos a mano.
 */
const Discord = require("discord.js");

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const TEXT = [Discord.ChannelType.GuildText, Discord.ChannelType.GuildAnnouncement];

// Primer canal de texto (en el orden del servidor) cuyo nombre encaja
function textChannel(guild, pattern) {
  return (
    guild.channels.cache
      .filter((c) => TEXT.includes(c.type) && pattern.test(norm(c.name)))
      .sort((a, b) => a.rawPosition - b.rawPosition)
      .first() || null
  );
}

// Canal guardado en la configuración (si sigue existiendo) o, si no, el que encaja por nombre
function configuredOrNamed(guild, id, pattern) {
  return (id && guild.channels.cache.get(id)) || textChannel(guild, pattern);
}

function roleByName(guild, name) {
  return guild.roles.cache.find((r) => r.name === name) || null;
}

module.exports = { norm, textChannel, configuredOrNamed, roleByName };
