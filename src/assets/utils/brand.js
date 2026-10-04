/*
 * Estilo de los mensajes de SampCity (branding/README.md): rojo "city" #E8392F, rosa "samp" #F59D99, títulos en
 * mayúsculas con una barra a la izquierda y pie con la web. Lo usan la verificación, los tickets, las normas y la
 * reorganización del servidor (src/assets/utils/serverLayout.js).
 */
const Discord = require("discord.js");

const COLORS = { red: 0xe8392f, pink: 0xf59d99, dark: 0x1a0612, ok: 0x2fd36b, warn: 0xffb35c };
const WEB = () => String(process.env.WEB_URL || "https://sampcity.app").replace(/\/+$/, "");
const SERVER_IP = () => process.env.SAMP_IP || "sv.sampcity.app:7781";

// Embed con la marca. title sin emoji al principio: se le pone "▌" delante.
function brandEmbed(guild, { title, desc, fields, color = COLORS.red, image, thumbnail, footer } = {}) {
  const e = new Discord.EmbedBuilder().setColor(color);
  if (title) e.setTitle(`▌ ${title}`);
  if (desc) e.setDescription(desc);
  if (fields?.length) e.addFields(fields.map((f) => ({ name: f.name, value: String(f.value).slice(0, 1024), inline: !!f.inline })));
  if (image) e.setImage(image);
  if (thumbnail) e.setThumbnail(thumbnail);
  const host = WEB().replace(/^https?:\/\//, "");
  e.setFooter({ text: footer || `SampCity RolePlay · ${host}`, iconURL: guild?.iconURL?.({ size: 64 }) || undefined });
  return e;
}

// Botón de enlace a una página de la web
const webButton = (label, path = "/", emoji) => {
  const b = new Discord.ButtonBuilder().setStyle(Discord.ButtonStyle.Link).setLabel(label).setURL(WEB() + path);
  if (emoji) b.setEmoji(emoji);
  return b;
};

module.exports = { COLORS, WEB, SERVER_IP, brandEmbed, webButton };
