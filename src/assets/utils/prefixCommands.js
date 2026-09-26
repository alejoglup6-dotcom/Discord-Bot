/*
 * Comandos con prefijo ("!"): cualquier comando de barra se puede usar escribiendo el prefijo delante.
 *
 *   !samp perfil Lelo_Drok        = /samp profile name:Lelo_Drok
 *   !economia depositar 500       = /economy deposit amount:500
 *   !fortuna                      = /fortune overview          (atajos de ALIASES, al estilo SampDroid)
 *   !cauto sultan                 = /fortune buy category:autos item:sultan
 *
 * El mensaje se convierte en un objeto que se comporta como la interacción de un comando de barra (opciones,
 * deferReply, editReply, reply, followUp...), así que se ejecuta exactamente el mismo código del comando.
 * Los nombres valen en inglés o en español (los de src/assets/utils/localizations.js), sin importar tildes.
 * Las opciones van en orden; la última de texto se queda con el resto del mensaje. Lo que el comando manda
 * "solo para ti" (efímero) llega por MD.
 */
const Discord = require("discord.js");
const { names } = require("./localizations");
const banSchema = require("../../database/models/userBans");

const T = Discord.ApplicationCommandOptionType;

// Atajos: !atajo -> comando, subcomando y opciones ya puestas
const ALIASES = {
  // Servidor SA-MP
  cuenta: { command: "samp", sub: "profile" },
  vincular: { command: "samp", sub: "link" },
  desvincular: { command: "samp", sub: "unlink" },
  conectados: { command: "samp", sub: "online" },
  jugadores: { command: "samp", sub: "online" },
  topsamp: { command: "samp", sub: "top" },

  // Fortuna
  fortuna: { command: "fortune", sub: "overview" },
  trabajos: { command: "fortune", sub: "jobs" },
  contrato: { command: "fortune", sub: "contract" },
  renunciar: { command: "fortune", sub: "resign" },
  trabajar: { command: "fortune", sub: "work" },
  tienda: { command: "fortune", sub: "store" },
  autos: { command: "fortune", sub: "store", fixed: { category: "autos" } },
  casas: { command: "fortune", sub: "store", fixed: { category: "casas" } },
  negocios: { command: "fortune", sub: "store", fixed: { category: "negocios" } },
  empresas: { command: "fortune", sub: "store", fixed: { category: "empresas" } },
  armas: { command: "fortune", sub: "store", fixed: { category: "armas" } },
  comprar: { command: "fortune", sub: "buy" },
  vender: { command: "fortune", sub: "sell" },
  cauto: { command: "fortune", sub: "buy", fixed: { category: "autos" } },
  ccasa: { command: "fortune", sub: "buy", fixed: { category: "casas" } },
  cnegocio: { command: "fortune", sub: "buy", fixed: { category: "negocios" } },
  cempresa: { command: "fortune", sub: "buy", fixed: { category: "empresas" } },
  carma: { command: "fortune", sub: "buy", fixed: { category: "armas" } },
  vauto: { command: "fortune", sub: "sell", fixed: { category: "autos" } },
  vcasa: { command: "fortune", sub: "sell", fixed: { category: "casas" } },
  vnegocio: { command: "fortune", sub: "sell", fixed: { category: "negocios" } },
  vempresa: { command: "fortune", sub: "sell", fixed: { category: "empresas" } },
  varma: { command: "fortune", sub: "sell", fixed: { category: "armas" } },
  cobrar: { command: "fortune", sub: "collect" },
  asaltar: { command: "fortune", sub: "heist" },
  atracar: { command: "fortune", sub: "heist" },

  // Economía
  banco: { command: "economy", sub: "balance" },
  saldo: { command: "economy", sub: "balance" },
  bal: { command: "economy", sub: "balance" },
  depositar: { command: "economy", sub: "deposit" },
  dep: { command: "economy", sub: "deposit" },
  retirar: { command: "economy", sub: "withdraw" },
  pagar: { command: "economy", sub: "pay" },
  enviar: { command: "economy", sub: "pay" },
  transferir: { command: "economy", sub: "pay" },
  robar: { command: "economy", sub: "rob" },
  diario: { command: "economy", sub: "daily" },
  semanal: { command: "economy", sub: "weekly" },
  mensual: { command: "economy", sub: "monthly" },
  mendigar: { command: "economy", sub: "beg" },
  pescar: { command: "economy", sub: "fish" },
  cazar: { command: "economy", sub: "hunt" },
  crimen: { command: "economy", sub: "crime" },

  // Otros
  ping: { command: "bot", sub: "ping" },
};

// Secciones de !comandos
const HELP_SECTIONS = [
  ["🎮 Servidor SA-MP", ["cuenta", "vincular", "desvincular", "conectados", "topsamp"]],
  ["🕴️ Fortuna", ["fortuna", "trabajos", "contrato", "renunciar", "trabajar", "cobrar", "asaltar"]],
  ["🏘️ Propiedades", ["autos", "casas", "negocios", "empresas", "armas", "comprar", "vender", "cauto", "ccasa", "cnegocio", "cempresa", "carma", "vauto", "vcasa"]],
  ["🏦 Economía", ["banco", "depositar", "retirar", "pagar", "robar", "diario", "semanal", "mensual", "pescar", "cazar", "crimen"]],
];

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Nombre interno o su traducción al español
function sameName(token, name) {
  const t = norm(token);
  return t !== "" && (t === norm(name) || (names[name] && t === norm(names[name])));
}

function shown(name) {
  return names[name] || name;
}

// Separa en palabras respetando "comillas"; guarda la posición para poder tomar "el resto del texto"
function tokenize(text) {
  const tokens = [];
  const re = /"([^"]*)"|(\S+)/g;
  let m;
  while ((m = re.exec(text))) tokens.push({ value: m[1] ?? m[2], start: m.index, quoted: m[1] !== undefined });
  return tokens;
}

function usage(prefix, commandJson, sub, group) {
  const parts = [prefix + shown(commandJson.name)];
  if (group) parts.push(shown(group.name));
  if (sub) parts.push(shown(sub.name));
  for (const o of sub?.options || []) parts.push(o.required ? `<${shown(o.name)}>` : `[${shown(o.name)}]`);
  return parts.join(" ");
}

// ---------------------------------------------------------------------------------------------------------------
// Conversión de cada opción

async function parseValue(message, spec, raw) {
  const guild = message.guild;
  const id = (re) => raw.match(re)?.[1];
  switch (spec.type) {
    case T.String: {
      if (!spec.choices?.length) return { value: raw };
      const n = norm(raw);
      const c =
        spec.choices.find((ch) => norm(ch.value) === n || norm(ch.name) === n) ||
        spec.choices.find((ch) => norm(ch.value).startsWith(n) || norm(ch.name).startsWith(n)) ||
        spec.choices.find((ch) => norm(ch.name).includes(n));
      return c ? { value: c.value } : null;
    }
    case T.Integer:
    case T.Number: {
      const m = raw.replace(/\s/g, "").match(/^(-?\d+(?:[.,]\d+)?)([km])?$/i);
      if (!m) return null;
      let v = parseFloat(m[1].replace(",", "."));
      if (m[2]) v *= m[2].toLowerCase() === "k" ? 1000 : 1000000;
      if (spec.type === T.Integer) v = Math.trunc(v);
      if (spec.min_value !== undefined && v < spec.min_value) return null;
      if (spec.max_value !== undefined && v > spec.max_value) return null;
      return { value: v };
    }
    case T.Boolean: {
      const n = norm(raw);
      if (["si", "yes", "true", "on", "1", "activar", "activado"].includes(n)) return { value: true };
      if (["no", "false", "off", "0", "desactivar", "desactivado"].includes(n)) return { value: false };
      return null;
    }
    case T.User: {
      const uid = id(/^<@!?(\d{15,21})>$/) || id(/^(\d{15,21})$/);
      if (!uid) return null;
      const user = await message.client.users.fetch(uid).catch(() => null);
      if (!user) return null;
      const member = await guild.members.fetch(uid).catch(() => null);
      return { value: uid, user, member };
    }
    case T.Channel: {
      const cid = id(/^<#(\d{15,21})>$/) || id(/^(\d{15,21})$/);
      const channel = cid ? guild.channels.cache.get(cid) : guild.channels.cache.find((c) => norm(c.name) === norm(raw));
      return channel ? { value: channel.id, channel } : null;
    }
    case T.Role: {
      const rid = id(/^<@&(\d{15,21})>$/) || id(/^(\d{15,21})$/);
      const role = rid ? guild.roles.cache.get(rid) : guild.roles.cache.find((r) => norm(r.name) === norm(raw));
      return role ? { value: role.id, role } : null;
    }
    case T.Mentionable: {
      const asRole = await parseValue(message, { type: T.Role }, raw);
      if (asRole && /^<@&/.test(raw)) return asRole;
      return (await parseValue(message, { type: T.User }, raw)) || asRole;
    }
    default:
      return null;
  }
}

async function parseOptions(message, text, tokens, specs, fixed) {
  const hoisted = [];
  let i = 0;
  const attachment = message.attachments.first();
  for (let k = 0; k < specs.length; k++) {
    const spec = specs[k];
    if (fixed[spec.name] !== undefined) {
      hoisted.push({ name: spec.name, type: spec.type, value: fixed[spec.name] });
      continue;
    }
    if (spec.type === T.Attachment) {
      if (attachment) hoisted.push({ name: spec.name, type: spec.type, value: attachment.id, attachment });
      else if (spec.required) return { error: spec };
      continue;
    }
    if (i >= tokens.length) {
      if (spec.required) return { error: spec };
      continue;
    }
    // La última opción de texto libre se queda con el resto del mensaje
    const laterTakesTokens = specs.slice(k + 1).some((s) => fixed[s.name] === undefined && s.type !== T.Attachment);
    let raw = tokens[i].value;
    let used = 1;
    if (spec.type === T.String && !spec.choices?.length && !laterTakesTokens && tokens.length - i > 1) {
      raw = text.slice(tokens[i].start).trim();
      used = tokens.length - i;
    }
    const parsed = await parseValue(message, spec, raw);
    if (!parsed) {
      if (spec.required) return { error: spec, invalid: raw };
      continue; // opcional que no encaja: la palabra queda para la siguiente opción
    }
    if (spec.type === T.String && spec.max_length && String(parsed.value).length > spec.max_length) {
      return { error: spec, invalid: raw, tooLong: spec.max_length };
    }
    hoisted.push({ name: spec.name, type: spec.type, ...parsed });
    i += used;
  }
  return { hoisted };
}

// ---------------------------------------------------------------------------------------------------------------
// Interacción a partir de un mensaje

class PrefixOptions {
  constructor(hoisted, sub, group) {
    this._hoistedOptions = hoisted;
    this._subcommand = sub || null;
    this._group = group || null;
    this.data = hoisted;
  }
  get(name) {
    return this._hoistedOptions.find((o) => o.name === name) || null;
  }
  getSubcommand(required = true) {
    if (!this._subcommand && required) throw new TypeError("Falta el subcomando");
    return this._subcommand;
  }
  getSubcommandGroup() {
    return this._group;
  }
  getString(name) {
    return this.get(name)?.value ?? null;
  }
  getInteger(name) {
    return this.get(name)?.value ?? null;
  }
  getNumber(name) {
    return this.get(name)?.value ?? null;
  }
  getBoolean(name) {
    return this.get(name)?.value ?? null;
  }
  getUser(name) {
    return this.get(name)?.user ?? null;
  }
  getMember(name) {
    return this.get(name)?.member ?? null;
  }
  getChannel(name) {
    return this.get(name)?.channel ?? null;
  }
  getRole(name) {
    return this.get(name)?.role ?? null;
  }
  getMentionable(name) {
    const o = this.get(name);
    return o?.member ?? o?.user ?? o?.role ?? null;
  }
  getAttachment(name) {
    return this.get(name)?.attachment ?? null;
  }
  getFocused() {
    return "";
  }
}

function isEphemeral(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.ephemeral) return true;
  if (payload.flags === undefined || payload.flags === null) return false;
  try {
    return new Discord.MessageFlagsBitField(payload.flags).has(Discord.MessageFlags.Ephemeral);
  } catch {
    return false;
  }
}

function cleanPayload(payload) {
  if (typeof payload === "string") payload = { content: payload };
  const out = { ...(payload || {}) };
  for (const k of ["withResponse", "fetchReply", "ephemeral", "flags"]) delete out[k];
  out.allowedMentions = out.allowedMentions || { repliedUser: false };
  return out;
}

class PrefixInteraction {
  constructor(client, message, commandName, options) {
    this.client = client;
    this.message = null; // en las interacciones de botón es el mensaje del botón; aquí no hay
    this.sourceMessage = message;
    this.id = message.id;
    this.type = Discord.InteractionType.ApplicationCommand;
    this.commandType = Discord.ApplicationCommandType.ChatInput;
    this.commandName = commandName;
    this.options = options;
    this.guild = message.guild;
    this.guildId = message.guildId;
    this.channel = message.channel;
    this.channelId = message.channelId;
    this.member = message.member;
    this.user = message.author;
    this.locale = "es-ES";
    this.createdTimestamp = message.createdTimestamp;
    this.createdAt = message.createdAt;
    this.deferred = false;
    this.replied = false;
    this.ephemeral = false;
    this.replyMessage = null;
    this.prefixed = true;
  }

  isCommand() {
    return true;
  }
  isChatInputCommand() {
    return true;
  }
  isRepliable() {
    return true;
  }
  isUserContextMenuCommand() {
    return false;
  }
  isMessageContextMenuCommand() {
    return false;
  }
  isButton() {
    return false;
  }
  isStringSelectMenu() {
    return false;
  }
  isAutocomplete() {
    return false;
  }
  inGuild() {
    return true;
  }

  async deferReply(options) {
    if (this.deferred || this.replied) return;
    this.deferred = true;
    this.ephemeral = isEphemeral(options);
    this.channel.sendTyping().catch(() => {});
  }

  // Lo "solo para ti" va por MD; si tiene los MD cerrados, al canal
  async sendPrivate(payload) {
    const msg = await this.user.send(cleanPayload(payload)).catch(() => null);
    if (msg) return msg;
    return this.sourceMessage.reply(cleanPayload(payload));
  }

  async reply(payload) {
    let msg;
    if (isEphemeral(payload) || (this.deferred && this.ephemeral)) msg = await this.sendPrivate(payload);
    else msg = await this.sourceMessage.reply(cleanPayload(payload));
    this.replied = true;
    this.replyMessage = this.replyMessage || msg;
    if (msg) msg.resource = { message: msg };
    return msg;
  }

  async editReply(payload) {
    if (this.replyMessage) return this.replyMessage.edit(cleanPayload(payload));
    const msg = this.ephemeral || isEphemeral(payload) ? await this.sendPrivate(payload) : await this.sourceMessage.reply(cleanPayload(payload));
    this.replied = true;
    this.replyMessage = msg;
    return msg;
  }

  async followUp(payload) {
    if (isEphemeral(payload)) return this.sendPrivate(payload);
    return this.channel.send(cleanPayload(payload));
  }

  async fetchReply() {
    return this.replyMessage;
  }

  async deleteReply() {
    if (this.replyMessage) await this.replyMessage.delete().catch(() => {});
    this.replyMessage = null;
  }

  async send(payload) {
    return this.channel.send(cleanPayload(payload));
  }

  async showModal() {
    throw new Error("Este comando abre un formulario: úsalo con /");
  }
}

// ---------------------------------------------------------------------------------------------------------------

function findSub(options, token) {
  return (options || []).find((o) => (o.type === T.Subcommand || o.type === T.SubcommandGroup) && sameName(token, o.name));
}

function helpEmbed(client, prefix) {
  const fields = HELP_SECTIONS.map(([title, list]) => ({
    name: title,
    value: list.map((a) => `\`${prefix}${a}\``).join(" "),
  }));
  fields.push({
    name: "⌨️ Todos los comandos",
    value:
      `Cualquier comando de barra también funciona con \`${prefix}\`: \`${prefix}comando subcomando opciones\`, ` +
      `por ejemplo \`${prefix}samp perfil Lelo_Drok\` o \`${prefix}economia depositar 500\`. ` +
      `Para ver los de una categoría: \`${prefix}categoria ayuda\` (ej. \`${prefix}fortuna ayuda\`).`,
  });
  return { title: "⌨️・Comandos con " + prefix, fields };
}

/**
 * Ejecuta un comando de barra a partir de un mensaje. Devuelve true si lo reconoció (aunque diera error de uso).
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Message} message
 * @param {string} text contenido sin el prefijo
 * @param {string} prefix
 */
async function runPrefixCommand(client, message, text, prefix = "!") {
  const tokens = tokenize(text);
  if (!tokens.length) return false;
  const first = tokens[0].value;

  if (["comandos", "cmd", "cmds"].includes(norm(first))) {
    await client.embed({ ...helpEmbed(client, prefix), type: "reply" }, new PrefixInteraction(client, message, "help", new PrefixOptions([])));
    return true;
  }

  let command = client.commands.find((c) => sameName(first, c.data.name));
  let json = command?.data.toJSON();
  let alias = ALIASES[norm(first)];
  // "!fortuna comprar ..." es el comando /fortuna, no el atajo "!fortuna"
  if (alias && command && tokens[1] && findSub(json.options, tokens[1].value)) alias = null;
  if (alias) {
    command = client.commands.get(alias.command);
    if (!command) return false;
    json = command.data.toJSON();
  }
  if (!command) return false;

  let rest = tokens.slice(1);
  let sub = null;
  let group = null;
  const hasSubs = (json.options || []).some((o) => o.type === T.Subcommand || o.type === T.SubcommandGroup);
  const reply = (desc) =>
    client.errNormal({ error: desc, type: "reply" }, new PrefixInteraction(client, message, json.name, new PrefixOptions([])));

  if (alias) {
    sub = json.options.find((o) => o.name === alias.sub);
    if (alias.group) {
      group = json.options.find((o) => o.name === alias.group);
      sub = group?.options.find((o) => o.name === alias.sub);
    }
  } else if (hasSubs) {
    const found = rest[0] && findSub(json.options, rest[0].value);
    if (found?.type === T.SubcommandGroup) {
      group = found;
      rest = rest.slice(1);
      sub = rest[0] && group.options.find((o) => sameName(rest[0].value, o.name));
    } else sub = found;
    if (!sub) {
      const list = (group ? group.options : json.options).map((o) => shown(o.name)).join(", ");
      await reply(`Uso: ${prefix}${shown(json.name)}${group ? " " + shown(group.name) : ""} <${list}>`);
      return true;
    }
    rest = rest.slice(1);
  }

  const specs = (sub ? sub.options : json.options) || [];
  const parsed = await parseOptions(message, text, rest, specs, alias?.fixed || {});
  if (parsed.error) {
    const what = parsed.tooLong
      ? `"${shown(parsed.error.name)}" puede tener como máximo ${parsed.tooLong} caracteres`
      : parsed.invalid
        ? `"${parsed.invalid}" no vale para ${shown(parsed.error.name)}`
        : `Falta ${shown(parsed.error.name)}`;
    await reply(`${what}. Uso: ${usage(prefix, json, sub, group)}`);
    return true;
  }

  const interaction = new PrefixInteraction(client, message, json.name, new PrefixOptions(parsed.hoisted, sub?.name, group?.name));

  const banned = await banSchema.findOne({ User: message.author.id }).lean();
  if (banned) {
    await client.errNormal({ error: "Los desarrolladores de este bot te banearon", type: "reply" }, interaction);
    return true;
  }

  // "ayuda" / "help" de cada categoría, igual que con la barra
  if (sub?.name === "help") {
    const list = json.options.map((o) => `\`${prefix}${shown(json.name)} ${shown(o.name)}\` - ${o.description}`).join("\n");
    await client.embed(
      { title: "❓・Panel de ayuda", desc: `Comandos de \`${shown(json.name)}\`\n\n${list}`, type: "reply" },
      interaction,
    );
    return true;
  }

  await command
    .run(client, interaction, parsed.hoisted)
    .catch((err) => client.emit("errorCreate", err, json.name, interaction));
  return true;
}

module.exports = { runPrefixCommand, tokenize, ALIASES, PrefixInteraction, PrefixOptions };
