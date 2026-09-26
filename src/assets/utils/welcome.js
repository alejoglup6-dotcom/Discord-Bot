/*
 * Mensajes de bienvenida y despedida: tarjeta con banner y foto del usuario (welcomeCard.js) y un embed
 * con los datos del miembro, quién lo invitó y los primeros pasos en el servidor.
 * Canales: los de /configurar bienvenida y despedida (welcomeChannels / leaveChannels) o, si no hay, los
 * que se llamen "bienvenidas" y "despedidas".
 * Texto propio: si el servidor configuró inviteMessages, se usa como descripción con sus {variables}.
 */
const Discord = require("discord.js");
const { makeCard } = require("./welcomeCard");
const welcomeSchema = require("../../database/models/welcomeChannels");
const leaveSchema = require("../../database/models/leaveChannels");
const messages = require("../../database/models/inviteMessages");
const { configuredOrNamed, textChannel } = require("./guildLookup");

// Canal configurado con /configurar o, si no, el que encaje por nombre
async function findChannel(guild, schema, pattern) {
  const data = schema ? await schema.findOne({ Guild: guild.id }).lean().catch(() => null) : null;
  return configuredOrNamed(guild, data?.Channel, pattern);
}

function fillTemplate(text, member, inviter, invites) {
  const map = {
    "{user:username}": member.user.username,
    "{user:discriminator}": member.user.discriminator,
    "{user:tag}": member.user.tag,
    "{user:mention}": `${member}`,
    "{inviter:username}": inviter?.username ?? "Sistema",
    "{inviter:discriminator}": inviter?.discriminator ?? "0000",
    "{inviter:tag}": inviter?.tag ?? "Sistema",
    "{inviter:mention}": inviter ? `<@${inviter.id}>` : "Sistema",
    "{inviter:invites}": invites?.Invites ?? "∞",
    "{inviter:invites:left}": invites?.Left ?? "0",
    "{guild:name}": member.guild.name,
    "{guild:members}": member.guild.memberCount,
  };
  return Object.entries(map).reduce((t, [k, v]) => t.split(k).join(String(v)), text);
}

async function card(type, member) {
  const guild = member.guild;
  return makeCard({
    type,
    avatarURL: member.user.displayAvatarURL({ extension: "png", size: 512, forceStatic: true }),
    name: member.displayName || member.user.globalName || member.user.username,
    guildName: guild.name,
    guildIconURL: guild.iconURL({ extension: "png", size: 256, forceStatic: true }),
    backgroundURL: process.env.WELCOME_BANNER || guild.bannerURL({ extension: "png", size: 1024 }) || null,
    memberCount: guild.memberCount,
    seed: guild.id,
  });
}

/**
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").GuildMember} member
 * @param {object} [info] { inviter: User, invites: {Invites, Left}, reward: {paid, tiers, fake, valid}, test: bool }
 * @returns {{ channel, message, card: boolean }} (message vacío si Discord no lo aceptó)
 */
async function sendWelcome(client, member, info = {}) {
  const guild = member.guild;
  const channel = await findChannel(guild, welcomeSchema, /bienvenid|welcome/);
  if (!channel) return { channel: null };

  const custom = await messages.findOne({ Guild: guild.id }).lean();
  const rules = textChannel(guild, /regla|norma|rules/);
  const inviteInfo = textChannel(guild, /recompensas invitaciones|invitacion/);
  const fortunaInfo = textChannel(guild, /info fortuna/);
  const { inviter, invites, reward } = info;

  const desc = custom?.inviteJoin
    ? fillTemplate(custom.inviteJoin, member, inviter, invites)
    : `Hola ${member}, ¡qué bueno tenerte en **${guild.name}**! 🎉\nEres el miembro **#${guild.memberCount.toLocaleString("es-ES")}** de la comunidad.`;

  const steps = [
    rules ? `📜 Lee las normas en ${rules}` : null,
    "🔗 Vincula tu cuenta del juego: `!vincular Nombre_Apellido`",
    "⌨️ Mira todo lo que puedes hacer: `!comandos`",
    fortunaInfo ? `🕴️ Juega a la Fortuna y gana premios: ${fortunaInfo}` : "🕴️ Juega a la Fortuna: `!fortuna`",
    inviteInfo ? `🎁 Invita amigos y gana recompensas: ${inviteInfo}` : null,
  ].filter(Boolean);

  const fields = [
    { name: "👤┆Usuario", value: `${member.user.tag}\n\`${member.id}\``, inline: true },
    { name: "📅┆Cuenta creada", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>\n<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
    {
      name: "📨┆Invitado por",
      value: inviter
        ? `<@${inviter.id}>\n${reward?.valid ?? invites?.Invites ?? 1} invitaciones válidas`
        : "Invitación directa",
      inline: true,
    },
    { name: "🚀┆Primeros pasos", value: steps.join("\n") },
  ];
  if (inviter && reward?.fake) {
    fields.push({
      name: "🛡️┆Cuenta nueva",
      value: `Esta cuenta de Discord tiene menos de ${require("../data/invites").MIN_ACCOUNT_DAYS} días: no suma para las recompensas de <@${inviter.id}> (medida contra multicuentas).`,
    });
  }
  if (reward?.tiers?.length) {
    fields.push({
      name: "🏆┆¡Nuevo nivel de invitaciones!",
      value: reward.tiers.map((t) => `<@${inviter.id}> llegó a **${t.role}** (${t.invites} invitaciones válidas)`).join("\n"),
    });
  }

  let files;
  let image;
  const png = await card("welcome", member).catch(() => null);
  if (png) {
    files = [new Discord.AttachmentBuilder(png, { name: "bienvenida.png" })];
    image = "attachment://bienvenida.png";
  }

  // En modo prueba (/prueba bienvenida) no se menciona a nadie y el título lo indica
  const test = info.test ? "🧪 PRUEBA · " : "";
  const message = await client
    .embed(
      {
        title: `${test}👋・¡Bienvenido/a a ${guild.name}!`,
        desc,
        thumbnail: member.user.displayAvatarURL({ size: 256 }),
        image,
        files,
        fields,
        color: "#ff7a59",
        content: info.test ? undefined : `${member}`,
      },
      channel,
    )
    .catch((err) => console.log("Bienvenida/despedida:", err.message));
  return { channel, message, card: Boolean(png) };
}

function duration(ms) {
  const d = Math.floor(ms / 86400000);
  if (d >= 365) return `${Math.floor(d / 365)} año(s)`;
  if (d >= 30) return `${Math.floor(d / 30)} mes(es)`;
  if (d >= 1) return `${d} día(s)`;
  const h = Math.floor(ms / 3600000);
  return h >= 1 ? `${h} hora(s)` : `${Math.max(1, Math.floor(ms / 60000))} minuto(s)`;
}

/**
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").GuildMember} member
 * @param {object} [info] { inviterId, invites: {Invites, Left}, test: bool }
 * @returns {{ channel, message, card: boolean }}
 */
async function sendLeave(client, member, info = {}) {
  const guild = member.guild;
  const channel = await findChannel(guild, leaveSchema, /despedid|goodbye/);
  if (!channel) return { channel: null };

  const custom = await messages.findOne({ Guild: guild.id }).lean();
  const inviter = info.inviterId ? await client.users.fetch(info.inviterId).catch(() => null) : null;
  const desc = custom?.inviteLeave
    ? fillTemplate(custom.inviteLeave, member, inviter, info.invites)
    : `**${member.user.tag}** dejó **${guild.name}**. ¡Esperamos verte de vuelta pronto! 👋`;

  const fields = [
    { name: "👤┆Usuario", value: `${member.user.tag}\n\`${member.id}\``, inline: true },
    { name: "⏳┆Estuvo con nosotros", value: member.joinedTimestamp ? duration(Date.now() - member.joinedTimestamp) : "Poco tiempo", inline: true },
    { name: "👥┆Ahora somos", value: guild.memberCount.toLocaleString("es-ES"), inline: true },
  ];
  if (inviter) fields.push({ name: "📨┆Lo invitó", value: `${inviter} (${info.invites?.Invites ?? 0} invitaciones)`, inline: true });

  let files;
  let image;
  const png = await card("leave", member).catch(() => null);
  if (png) {
    files = [new Discord.AttachmentBuilder(png, { name: "despedida.png" })];
    image = "attachment://despedida.png";
  }

  const test = info.test ? "🧪 PRUEBA · " : "";
  const message = await client
    .embed(
      {
        title: `${test}👋・¡Hasta pronto, ${member.displayName || member.user.username}!`,
        desc,
        thumbnail: member.user.displayAvatarURL({ size: 256 }),
        image,
        files,
        fields,
        color: "#8a93a6",
      },
      channel,
    )
    .catch((err) => console.log("Bienvenida/despedida:", err.message));
  return { channel, message, card: Boolean(png) };
}

module.exports = { sendWelcome, sendLeave, findChannel, fillTemplate };
