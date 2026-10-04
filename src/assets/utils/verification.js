/*
 * Verificación del Discord con la cuenta del juego.
 * Para estar verificado hay que vincular el Discord con la cuenta de SA-MP desde la web (/verificar: se inicia
 * sesión con la cuenta del servidor y se autoriza Discord; queda en discord_links). Entonces el bot:
 *  - da el rol de verificado (👤 USUARIO, o VERIFY_ROLE del .env),
 *  - cambia el apodo por el nombre del personaje (Nombre_Apellido) y lo vuelve a poner si se lo cambian.
 * Quien no está vinculado no está verificado: en modo "on" se le quita el rol (también a los que se verificaron antes
 * con el captcha viejo). Los administradores del Discord y los bots no se tocan.
 * VERIFICACION = on (por defecto) | suave (da rol y apodo pero no quita a nadie) | off.
 */
const Discord = require("discord.js");
const db = require("../../database/mysql");
const data = require("../data/rangos");
const { norm } = require("./guildLookup");
const { brandEmbed, webButton, COLORS } = require("./brand");

const MODE = () => String(process.env.VERIFICACION || "on").toLowerCase();

function verifiedRole(guild) {
  return (
    (process.env.VERIFY_ROLE && guild.roles.cache.get(process.env.VERIFY_ROLE)) ||
    guild.roles.cache.find((r) => r.name === data.LINKED_ROLE) ||
    guild.roles.cache.find((r) => norm(r.name) === "usuario") ||
    null
  );
}

// Apodo = nombre de la cuenta del juego (máximo 32 caracteres en Discord)
const nickFor = (name) => String(name || "").slice(0, 32);

async function links() {
  const rows = await db.query(
    "SELECT dl.discord_id, dl.linked_at, p.id, p.name FROM discord_links dl JOIN player p ON p.id = dl.player_id",
  );
  return new Map(rows.map((r) => [String(r.discord_id), { playerId: Number(r.id), name: r.name, linkedAt: r.linked_at }]));
}

const exempt = (member) => member.user.bot || member.permissions?.has?.(Discord.PermissionFlagsBits.Administrator);

/*
 * Qué hacer con un miembro: { addRole, removeRole, nick } (nick = apodo que hay que poner, o null).
 * link = fila de links() o undefined.
 */
function planMember(member, link, role, guild, mode = MODE()) {
  const out = { addRole: false, removeRole: false, nick: null };
  if (member.user.bot) return out;
  const has = member.roles.cache.has(role.id);
  if (link) {
    if (!has) out.addRole = true;
    const want = nickFor(link.name);
    // al dueño del servidor y a los que están por encima del bot Discord no deja cambiarles el apodo
    if (member.id !== guild.ownerId && member.manageable !== false && (member.nickname || member.user.username) !== want) out.nick = want;
  } else if (has && mode === "on" && !exempt(member)) out.removeRole = true;
  return out;
}

async function applyMember(member, link, role, log = () => {}, opts = {}) {
  const p = planMember(member, link, role, member.guild, opts.mode);
  if (p.addRole) await member.roles.add(role, "Cuenta del juego vinculada").then(() => log(`verificado ${member.user.tag} = ${link.name}`)).catch((e) => log(`error rol ${member.user.tag}: ${e.message}`));
  if (p.removeRole) await member.roles.remove(role, "Sin cuenta del juego vinculada").then(() => log(`sin verificar ${member.user.tag}`)).catch((e) => log(`error rol ${member.user.tag}: ${e.message}`));
  if (p.nick) await member.setNickname(p.nick, "Nombre del personaje").catch(() => {});
  if (p.addRole && opts.welcome !== false) await member.send({ embeds: [welcomeDm(member.guild, link)] }).catch(() => {});
  return p;
}

function welcomeDm(guild, link) {
  return brandEmbed(guild, {
    title: "VERIFICADO",
    color: COLORS.ok,
    desc:
      `Tu Discord quedó unido a la cuenta **${link.name}**. Ya ves todos los canales de **${guild.name}** y tu apodo ` +
      `es el de tu personaje.\n\nSi algún día quieres desvincularlo, hazlo desde tu perfil en la web.`,
  });
}

// Panel del canal de verificación
function panel(guild) {
  const embed = brandEmbed(guild, {
    title: "VERIFÍCATE CON TU CUENTA DEL SERVIDOR",
    desc:
      "Para entrar al resto del Discord necesitas una cuenta en **SampCity**. Así sabemos quién es quién dentro y fuera del juego.\n\n" +
      "**1.** Pulsa **Verificarme en la web** e inicia sesión con tu `Nombre_Apellido` y tu contraseña del juego.\n" +
      "**2.** Pulsa **Vincular con Discord** y acepta (solo vemos tu usuario e ID).\n" +
      "**3.** Vuelve aquí: en menos de un minuto se abren los canales y tu apodo pasa a ser el de tu personaje.\n\n" +
      "¿Aún no tienes cuenta? Entra al servidor y regístrate; luego vuelve a este paso.\n" +
      "¿Algo no funciona? Abre un ticket en el canal de soporte (está justo aquí arriba).",
  });
  const row = new Discord.ActionRowBuilder().addComponents(
    webButton("Verificarme en la web", "/verificar", "🔐"),
    new Discord.ButtonBuilder().setCustomId("Bot_verify").setStyle(Discord.ButtonStyle.Secondary).setLabel("Ya me vinculé").setEmoji("✅"),
  );
  return { embeds: [embed], components: [row] };
}

// Botón "Ya me vinculé" (customId Bot_verify): comprueba ahora mismo sin esperar a la siguiente vuelta
async function onButton(client, interaction) {
  await interaction.deferReply({ flags: Discord.MessageFlags.Ephemeral }).catch(() => {});
  const role = verifiedRole(interaction.guild);
  let link = null;
  try {
    link = (await links()).get(interaction.user.id) || null;
  } catch {
    return interaction.editReply({ content: "No puedo consultar las cuentas ahora mismo. Inténtalo en un minuto." }).catch(() => {});
  }
  if (!link) {
    const row = new Discord.ActionRowBuilder().addComponents(webButton("Verificarme en la web", "/verificar", "🔐"));
    return interaction
      .editReply({
        embeds: [brandEmbed(interaction.guild, { title: "TODAVÍA NO ESTÁS VINCULADO", color: COLORS.warn, desc: "Tu Discord no está unido a ninguna cuenta del juego. Hazlo desde la web y vuelve a pulsar el botón." })],
        components: [row],
      })
      .catch(() => {});
  }
  if (role) await applyMember(interaction.member, link, role, () => {}, { welcome: false });
  return interaction
    .editReply({ embeds: [brandEmbed(interaction.guild, { title: "¡LISTO!", color: COLORS.ok, desc: `Estás verificado como **${link.name}**.` })] })
    .catch(() => {});
}

module.exports = { MODE, verifiedRole, nickFor, links, planMember, applyMember, panel, onButton, welcomeDm };
