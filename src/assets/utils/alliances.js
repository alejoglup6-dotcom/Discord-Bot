/*
 * Canal de alianzas: cuando alguien publica la plantilla de otro servidor, el bot la vuelve a publicar él y borra
 * el mensaje original, así en el canal solo se ven mensajes del bot.
 * - El canal se encuentra por su nombre (el que tenga "alianza", p. ej. "🤝┆alianzas").
 * - Se copian el texto (con su formato y enlaces de invitación) y los archivos adjuntos.
 * - Las menciones (@everyone, @here, roles o usuarios) se copian como texto pero NO avisan a nadie.
 * - Primero se publica la copia y después se borra el original: si algo falla, el original se queda y no se pierde.
 */
const Discord = require("discord.js");
const { norm } = require("./guildLookup");

const LIMIT = 2000; // máximo de caracteres por mensaje del bot (los usuarios con Nitro pueden escribir hasta 4000)
const TEXT = [Discord.ChannelType.GuildText, Discord.ChannelType.GuildAnnouncement];

function isAllianceChannel(channel) {
  return Boolean(channel?.guild && TEXT.includes(channel.type) && /alianza/.test(norm(channel.name)));
}

// Parte un texto largo en trozos de hasta `limit` caracteres, cortando por líneas (o por espacios si una línea no cabe)
function splitMessage(text, limit = LIMIT) {
  const out = [];
  let cur = "";
  const push = () => {
    if (cur) out.push(cur);
    cur = "";
  };
  for (const line of String(text || "").split("\n")) {
    const candidate = cur ? cur + "\n" + line : line;
    if (candidate.length <= limit) {
      cur = candidate;
      continue;
    }
    push();
    if (line.length <= limit) {
      cur = line;
      continue;
    }
    // Línea más larga que el límite: se corta por palabras (o a la fuerza si no hay espacios)
    let rest = line;
    while (rest.length > limit) {
      let cut = rest.lastIndexOf(" ", limit);
      if (cut <= 0) cut = limit;
      out.push(rest.slice(0, cut));
      rest = rest.slice(cut).replace(/^ /, "");
    }
    cur = rest;
  }
  push();
  return out;
}

async function download(attachment) {
  const res = await fetch(attachment.url);
  if (!res.ok) throw new Error(`No se pudo descargar ${attachment.name}: HTTP ${res.status}`);
  return new Discord.AttachmentBuilder(Buffer.from(await res.arrayBuffer()), {
    name: attachment.name,
    description: attachment.description || undefined,
  });
}

/**
 * Vuelve a publicar como el bot un mensaje del canal de alianzas y borra el original.
 * @param {Discord.Message} message
 * @returns {Promise<boolean>} true si se publicó la copia y se borró el original
 */
async function repostAlliance(message) {
  if (message.author?.bot || message.system || !isAllianceChannel(message.channel)) return false;
  const me = message.guild.members.me;
  const perms = me && message.channel.permissionsFor(me);
  if (!perms?.has([Discord.PermissionFlagsBits.SendMessages, Discord.PermissionFlagsBits.ManageMessages, Discord.PermissionFlagsBits.AttachFiles])) return false;

  const chunks = splitMessage(message.content);
  const files = [];
  for (const a of message.attachments.values()) files.push(await download(a));
  if (!chunks.length && !files.length) return false; // solo stickers u otra cosa que no se puede copiar: se deja como está

  const noPings = { parse: [] };
  if (!chunks.length) chunks.push("");
  for (let i = 0; i < chunks.length; i++) {
    const last = i === chunks.length - 1;
    // Los archivos van con el último trozo, debajo del texto
    await message.channel.send({ content: chunks[i] || undefined, files: last ? files : [], allowedMentions: noPings });
  }
  await message.delete();
  return true;
}

module.exports = { isAllianceChannel, splitMessage, repostAlliance, LIMIT };
