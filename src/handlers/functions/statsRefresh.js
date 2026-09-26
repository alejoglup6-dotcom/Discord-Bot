const Discord = require("discord.js");
const { Chalk } = require("chalk");
const chalk = new Chalk();

const Schema = require("../../database/models/stats");

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
  Members: ["👤", (g) => `Miembros: ${g.memberCount.toLocaleString("es-ES")}`],
  Boost: ["💎", (g) => `Boosts: ${g.premiumSubscriptionCount || 0}`],
  BoostTier: ["🥇", (g) => `Nivel: ${Number(g.premiumTier) || 0}`],
  Channels: ["🔧", (g) => `Canales: ${g.channels.cache.size}`],
  Roles: ["👔", (g) => `Roles: ${g.roles.cache.size}`],
  Emojis: ["😛", (g) => `Emojis: ${g.emojis.cache.size}`],
  AnimatedEmojis: ["🤡", (g) => `Emojis animados: ${g.emojis.cache.filter((e) => e.animated).size}`],
  StaticEmojis: ["🤡", (g) => `Emojis estáticos: ${g.emojis.cache.filter((e) => !e.animated).size}`],
  TextChannels: ["💬", (g) => `Canales de texto: ${g.channels.cache.filter((c) => c.type === Discord.ChannelType.GuildText).size}`],
  VoiceChannels: ["🔊", (g) => `Canales de voz: ${g.channels.cache.filter((c) => c.type === Discord.ChannelType.GuildVoice).size}`],
  NewsChannels: ["📢", (g) => `Canales de anuncios: ${g.channels.cache.filter((c) => c.type === Discord.ChannelType.GuildAnnouncement).size}`],
  StageChannels: ["🎤", (g) => `Canales de escenario: ${g.channels.cache.filter((c) => c.type === Discord.ChannelType.GuildStageVoice).size}`],
};

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
    const data = await Schema.findOne({ Guild: guild.id }).lean();
    if (!data) return [];
    const template = data.ChannelTemplate || "{emoji} {name}";
    const results = [];
    for (const [field, [emoji, text]] of Object.entries(COUNTERS)) {
      if (!data[field]) continue;
      const channel = guild.channels.cache.get(data[field]);
      if (!channel) {
        warn(`${guild.id}:${field}`, `${guild.name}: el canal del contador "${field}" ya no existe. Vuelve a crearlo con /montar o /estadisticas.`);
        results.push({ field, reason: "missing" });
        continue;
      }
      const name = template.replace("{emoji}", emoji).replace("{name}", text(guild));
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
      }, delay),
    );
  }
  client.scheduleStats = schedule;

  async function refreshAll() {
    const all = await Schema.find({}).lean().catch(() => []);
    for (const d of all) {
      const guild = client.guilds.cache.get(d.Guild);
      if (guild) await client.refreshStats(guild).catch(() => {});
    }
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
