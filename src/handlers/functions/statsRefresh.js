const Discord = require("discord.js");
const { Chalk } = require("chalk");
const chalk = new Chalk();

const Schema = require("../../database/models/stats");
const { norm } = require("../../assets/utils/guildLookup");

/*
 * Contadores de estadísticas (canales de voz con "👤 Miembros: 123", etc.).
 * Antes solo se renombraban cuando pasaba algo (alguien entraba, se creaba un canal...), nunca al arrancar,
 * y los errores se tragaban. Ahora:
 * - se actualizan al arrancar el bot y cada 10 minutos, y un minuto después de cada cambio;
 * - solo se renombra un canal si el texto cambió, y como mucho cada 5 minutos por canal (Discord permite
 *   2 cambios de nombre cada 10 minutos por canal; pasarse deja la cola de ese canal bloqueada);
 * - si falta el canal o el permiso de "Gestionar canales", se avisa una vez en la consola.
 */
const COUNTERS = {
  Members: ["👤", "Miembros", (g) => g.memberCount.toLocaleString("es-ES")],
  Boost: ["💎", "Boosts", (g) => g.premiumSubscriptionCount || 0],
  BoostTier: ["🥇", "Nivel", (g) => Number(g.premiumTier) || 0],
  Channels: ["🔧", "Canales", (g) => g.channels.cache.size],
  Roles: ["👔", "Roles", (g) => g.roles.cache.size],
  Emojis: ["😛", "Emojis", (g) => g.emojis.cache.size],
  AnimatedEmojis: ["🤡", "Emojis animados", (g) => g.emojis.cache.filter((e) => e.animated).size],
  StaticEmojis: ["🤡", "Emojis estáticos", (g) => g.emojis.cache.filter((e) => !e.animated).size],
  TextChannels: ["💬", "Canales de texto", (g) => g.channels.cache.filter((c) => c.type === Discord.ChannelType.GuildText).size],
  VoiceChannels: ["🔊", "Canales de voz", (g) => g.channels.cache.filter((c) => c.type === Discord.ChannelType.GuildVoice).size],
  NewsChannels: ["📢", "Canales de anuncios", (g) => g.channels.cache.filter((c) => c.type === Discord.ChannelType.GuildAnnouncement).size],
  StageChannels: ["🎤", "Canales de escenario", (g) => g.channels.cache.filter((c) => c.type === Discord.ChannelType.GuildStageVoice).size],
};

// Sin configuración: los canales de voz de la categoría "Estadísticas" que se llamen "Miembros: 9", etc.
function discover(guild) {
  const found = {};
  const category = guild.channels.cache.find((c) => c.type === Discord.ChannelType.GuildCategory && /estadistica|stats/.test(norm(c.name)));
  if (!category) return found;
  const voices = guild.channels.cache.filter((c) => c.parentId === category.id && c.type === Discord.ChannelType.GuildVoice);
  for (const [field, [, label]] of Object.entries(COUNTERS)) {
    const re = new RegExp(`(^| )${norm(label)} [0-9]`);
    const ch = voices.find((c) => re.test(norm(c.name)) && !Object.values(found).includes(c.id));
    if (ch) found[field] = ch.id;
  }
  return found;
}

// Nombre nuevo: si el canal ya tiene "Etiqueta: número", solo se cambia el número (se conserva su emoji)
function counterName(channel, template, [emoji, label, value], guild) {
  const v = String(value(guild));
  if (new RegExp(`${norm(label)} [0-9]`).test(norm(channel.name)) && /[0-9][0-9.,]*\s*$/.test(channel.name)) {
    return channel.name.replace(/[0-9][0-9.,]*\s*$/, v);
  }
  return template.replace("{emoji}", emoji).replace("{name}", `${label}: ${v}`);
}

const MIN_RENAME_GAP = 5 * 60000;
const INTERVAL = 10 * 60000;
const DEBOUNCE = 60000;

module.exports = (client) => {
  const lastRename = new Map(); // canal -> momento del último cambio de nombre
  const pending = new Map(); // servidor -> temporizador
  const warned = new Set();

  function warn(key, text) {
    if (warned.has(key)) return;
    warned.add(key);
    console.log(chalk.yellow(`[AVISO]`), chalk.white(`>>`), chalk.yellow(`Estadísticas`), chalk.white(`>>`), chalk.yellow(text));
  }

  // Devuelve la lista de cambios: [{ field, channel, from, to, done, reason }]
  client.refreshStats = async function (guild, { dryRun = false } = {}) {
    const saved = await Schema.findOne({ Guild: guild.id }).lean();
    const data = saved ? { ...discover(guild), ...Object.fromEntries(Object.entries(saved).filter(([, v]) => v)) } : discover(guild);
    if (!Object.keys(COUNTERS).some((f) => data[f])) return [];
    const template = data.ChannelTemplate || "{emoji} {name}";
    const results = [];
    for (const [field, counter] of Object.entries(COUNTERS)) {
      if (!data[field]) continue;
      const channel = guild.channels.cache.get(data[field]);
      if (!channel) {
        warn(`${guild.id}:${field}`, `${guild.name}: el canal del contador "${field}" ya no existe. Vuelve a crearlo con /estadisticas.`);
        results.push({ field, reason: "missing" });
        continue;
      }
      const name = counterName(channel, template, counter, guild);
      if (channel.name === name) {
        results.push({ field, channel, to: name, done: true, reason: "same" });
        continue;
      }
      const wait = (lastRename.get(channel.id) || 0) + MIN_RENAME_GAP - Date.now();
      if (dryRun || wait > 0) {
        results.push({ field, channel, from: channel.name, to: name, done: false, reason: dryRun ? "dry" : "wait" });
        if (!dryRun) schedule(guild, wait + 1000);
        continue;
      }
      lastRename.set(channel.id, Date.now());
      try {
        await channel.setName(name);
        results.push({ field, channel, from: channel.name, to: name, done: true });
      } catch (err) {
        warn(`${guild.id}:perm`, `${guild.name}: no pude renombrar "${channel.name}" (${err.message}). El bot necesita el permiso "Gestionar canales" en esos canales.`);
        results.push({ field, channel, to: name, done: false, reason: err.message });
      }
    }
    return results;
  };

  function schedule(guild, delay = DEBOUNCE) {
    if (pending.has(guild.id)) return;
    pending.set(
      guild.id,
      setTimeout(() => {
        pending.delete(guild.id);
        client.refreshStats(guild).catch(() => {});
      }, delay).unref(),
    );
  }
  client.scheduleStats = schedule;

  async function refreshAll() {
    for (const guild of client.guilds.cache.values()) await client.refreshStats(guild).catch(() => {});
  }

  client.once(Discord.Events.ClientReady, () => {
    setTimeout(refreshAll, 15000);
    setInterval(refreshAll, INTERVAL);
  });

  // Cambios que mueven algún contador
  const onGuild = (guild) => guild && schedule(guild);
  client.on(Discord.Events.GuildMemberAdd, (m) => onGuild(m.guild));
  client.on(Discord.Events.GuildMemberRemove, (m) => onGuild(m.guild));
  client.on(Discord.Events.ChannelCreate, (c) => onGuild(c.guild));
  client.on(Discord.Events.ChannelDelete, (c) => onGuild(c.guild));
  client.on(Discord.Events.GuildRoleCreate, (r) => onGuild(r.guild));
  client.on(Discord.Events.GuildRoleDelete, (r) => onGuild(r.guild));
  client.on(Discord.Events.GuildEmojiCreate, (e) => onGuild(e.guild));
  client.on(Discord.Events.GuildEmojiDelete, (e) => onGuild(e.guild));
  client.on(Discord.Events.GuildUpdate, (_old, guild) => onGuild(guild));
};

module.exports.counterName = counterName;
module.exports.discover = discover;
module.exports.COUNTERS = COUNTERS;
