/*
 * Motor de copias de seguridad del servidor de Discord (ver src/database/serverBackup.js para cómo se guardan).
 * Usa la API de Discord directamente (client.rest) para guardar los datos tal cual los da Discord.
 *
 * COPIA: ajustes e imágenes del servidor, roles con permisos, categorías y canales con sus permisos, emojis,
 *        stickers, miembros con sus roles, baneos, reglas de automod, onboarding y pantalla de bienvenida, y todos
 *        los mensajes (también de hilos) con sus archivos adjuntos. Los mensajes se guardan de forma incremental.
 * RESTAURACIÓN: vuelve a crear lo que falte (roles, canales, emojis, stickers) con sus permisos y posiciones,
 *        deja como estaban los roles y canales que siguen existiendo (nombre, permisos, categoría), repone los
 *        ajustes del servidor y los roles de los miembros, y vuelve a publicar con webhooks los mensajes de los
 *        canales que hubo que volver a crear (con el nombre y la foto de quien los escribió). Opcional: borrar los
 *        canales y roles que no estaban en la copia y dejar la lista de baneos como estaba.
 */
const { Routes } = require("discord.js");
const store = require("../../database/serverBackup");

const CDN = "https://cdn.discordapp.com";
const MAX_FILE = () => (parseFloat(process.env.BACKUP_MAX_FILE_MB) || 8) * 1024 * 1024;
const TEXT_TYPES = [0, 2, 5, 13, 15, 10, 11, 12]; // texto, voz (chat), anuncios, escenario, foro e hilos
const THREAD_TYPES = [10, 11, 12];

async function download(url, max = 10 * 1024 * 1024) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > max) throw new Error("demasiado grande");
  return buf;
}
const dataUri = (buf, mime = "image/png") => `data:${mime};base64,${buf.toString("base64")}`;
const imageUrl = (kind, id, hash) => hash && `${CDN}/${kind}/${id}/${hash}.${hash.startsWith("a_") ? "gif" : "png"}?size=1024`;
const safe = (p) => p.catch(() => null);

// ================================================================= COPIA

async function paged(rest, route, key = "id", limit = 1000) {
  const out = [];
  let after = "0";
  for (;;) {
    const page = await rest.get(route, { query: new URLSearchParams({ limit: String(limit), after }) });
    if (!page?.length) break;
    out.push(...page);
    after = page.map((x) => (key === "user" ? x.user.id : x[key])).sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1)).pop();
    if (page.length < limit) break;
  }
  return out;
}

/** Estructura del servidor (sin mensajes) */
async function captureStructure(rest, guildId) {
  const guild = await rest.get(Routes.guild(guildId), { query: new URLSearchParams({ with_counts: "true" }) });
  const [roles, channels, emojis, stickers, active] = await Promise.all([
    rest.get(Routes.guildRoles(guildId)),
    rest.get(Routes.guildChannels(guildId)),
    rest.get(Routes.guildEmojis(guildId)),
    safe(rest.get(Routes.guildStickers(guildId))),
    safe(rest.get(Routes.guildActiveThreads(guildId))),
  ]);
  const members = await safe(paged(rest, Routes.guildMembers(guildId), "user"));
  const bans = await safe(paged(rest, Routes.guildBans(guildId), "user"));
  const [automod, onboarding, welcome] = await Promise.all([
    safe(rest.get(Routes.guildAutoModerationRules(guildId))),
    safe(rest.get(`/guilds/${guildId}/onboarding`)),
    safe(rest.get(Routes.guildWelcomeScreen(guildId))),
  ]);

  // Hilos: los activos y los archivados públicos de cada canal de texto, anuncios o foro
  const threads = [...(active?.threads || [])];
  for (const c of channels.filter((c) => [0, 5, 15].includes(c.type))) {
    const arch = await safe(rest.get(Routes.channelThreads(c.id, "public"), { query: new URLSearchParams({ limit: "100" }) }));
    for (const t of arch?.threads || []) if (!threads.some((x) => x.id === t.id)) threads.push(t);
  }

  // Imágenes pequeñas dentro de la copia (base64): ícono, banner, fondo de invitación, emojis y stickers
  const images = {};
  for (const [k, kind, hash] of [["icon", "icons", guild.icon], ["banner", "banners", guild.banner], ["splash", "splashes", guild.splash], ["discovery_splash", "discovery-splashes", guild.discovery_splash]]) {
    if (hash) images[k] = (await safe(download(imageUrl(kind, guildId, hash))))?.toString("base64") || null;
  }
  for (const e of emojis) e.image = (await safe(download(`${CDN}/emojis/${e.id}.${e.animated ? "gif" : "png"}`, 512 * 1024)))?.toString("base64") || null;
  for (const s of stickers || []) {
    const ext = s.format_type === 3 ? "json" : s.format_type === 4 ? "gif" : "png";
    s.image = (await safe(download(`${CDN}/stickers/${s.id}.${ext}`, 1024 * 1024)))?.toString("base64") || null;
  }

  const snapshot = {
    version: 1,
    taken_at: new Date().toISOString(),
    guild,
    images,
    roles,
    channels,
    threads,
    emojis,
    stickers: stickers || [],
    members: (members || []).map((m) => ({ id: m.user.id, username: m.user.username, global_name: m.user.global_name || null, bot: Boolean(m.user.bot), nick: m.nick || null, roles: m.roles, joined_at: m.joined_at })),
    bans: (bans || []).map((b) => ({ id: b.user.id, username: b.user.username, reason: b.reason || null })),
    automod: automod || [],
    onboarding: onboarding || null,
    welcome_screen: welcome || null,
  };
  snapshot.stats = {
    roles: roles.length,
    channels: channels.length,
    threads: threads.length,
    emojis: emojis.length,
    stickers: snapshot.stickers.length,
    members: snapshot.members.length,
    bans: snapshot.bans.length,
  };
  return snapshot;
}

/** Mensajes nuevos de todos los canales (desde el último guardado de cada uno), con sus archivos */
async function captureMessages(rest, guildId, channels, log = () => {}) {
  const last = await store.lastMessageIds(guildId);
  const r = { messages: 0, files: 0, fileBytes: 0, skippedFiles: 0, channels: 0, failedChannels: [] };
  for (const c of channels.filter((c) => TEXT_TYPES.includes(c.type) && c.type !== 15)) {
    let after = last.get(c.id) || "0";
    try {
      for (;;) {
        const batch = await rest.get(Routes.channelMessages(c.id), { query: new URLSearchParams({ limit: "100", after }) });
        if (!batch?.length) break;
        batch.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
        for (const m of batch) m.channel_id = c.id;
        r.messages += await store.saveMessages(guildId, batch);
        for (const m of batch) {
          for (const a of m.attachments || []) {
            if (a.size > MAX_FILE()) { r.skippedFiles++; continue; }
            if (await store.hasFile(a.id)) continue;
            const buf = await safe(download(a.url, MAX_FILE()));
            if (!buf) { r.skippedFiles++; continue; }
            if (await store.saveFile(a.id, m.id, a.filename, a.content_type, buf)) { r.files++; r.fileBytes += buf.length; }
          }
        }
        after = batch[batch.length - 1].id;
        if (batch.length < 100) break;
      }
      r.channels++;
    } catch (err) {
      // Canal sin acceso para el bot, u otro error: se sigue con los demás
      r.failedChannels.push(`${c.name}: ${err.message}`);
    }
    log(r);
  }
  return r;
}

/**
 * Hace una copia completa: estructura + mensajes nuevos.
 * @returns {{ id, size, stats, messages }}
 */
const running = new Set(); // servidores con una copia en marcha (la automática y /backup crear no se pisan)

async function createBackup(rest, guildId, { kind = "manual", by = "", log } = {}) {
  if (running.has(guildId)) throw new Error("Ya se está haciendo una copia de este servidor, espera a que termine");
  running.add(guildId);
  try {
    return await doBackup(rest, guildId, { kind, by, log });
  } finally {
    running.delete(guildId);
  }
}

async function doBackup(rest, guildId, { kind, by, log }) {
  await store.init();
  const snapshot = await captureStructure(rest, guildId);
  const messages = await captureMessages(rest, guildId, [...snapshot.channels, ...snapshot.threads], log);
  snapshot.stats.new_messages = messages.messages;
  snapshot.stats.new_files = messages.files;
  snapshot.stats.failed_channels = messages.failedChannels.length;
  const saved = await store.saveSnapshot(guildId, kind, by, snapshot);
  return { ...saved, stats: snapshot.stats, messages };
}

// ================================================================= ARCHIVO (copia fuera de la base de datos)

const FORMAT = "sampcity-discord-backup";

/**
 * Archivo .json.gz con la estructura y, si cabe en `maxBytes`, el texto de todos los mensajes.
 * Sirve para guardar una copia fuera del hosting y para restaurar aunque se pierda la base de datos.
 */
async function exportBackup(backup, maxBytes = 9.5 * 1024 * 1024) {
  const base = { format: FORMAT, version: 1, backup_id: backup.id, created_at: backup.created_at, snapshot: backup.snapshot };
  const messages = {};
  for (const c of [...backup.snapshot.channels, ...backup.snapshot.threads]) {
    const list = await store.channelMessages(c.id);
    if (list.length) messages[c.id] = list;
  }
  const full = store.pack({ ...base, messages });
  if (full.length <= maxBytes) return { buffer: full, withMessages: true };
  return { buffer: store.pack(base), withMessages: false };
}

function importBackup(buffer) {
  let data;
  try {
    data = store.unpack(buffer);
  } catch {
    throw new Error("El archivo no es una copia válida (tiene que ser el .json.gz de /backup descargar)");
  }
  if (data?.format !== FORMAT || !data.snapshot?.guild) throw new Error("El archivo no es una copia de seguridad del bot");
  const messages = data.messages || {};
  return { snapshot: data.snapshot, source: { messages: async (id) => messages[id] || [], file: async () => null } };
}

// ================================================================= RESTAURACIÓN

// Permisos de un canal con los IDs de los roles nuevos
function remapOverwrites(overwrites, roleMap, guildId, oldGuildId) {
  return (overwrites || [])
    .map((o) => {
      if (o.type === 0) {
        const id = o.id === oldGuildId ? guildId : roleMap.get(o.id);
        return id ? { id, type: 0, allow: o.allow, deny: o.deny } : null;
      }
      return { id: o.id, type: 1, allow: o.allow, deny: o.deny };
    })
    .filter(Boolean);
}

function sortChannels(channels) {
  // Primero las categorías (para poder meter los canales dentro), después el resto, cada grupo en su orden
  return [...channels].sort((a, b) => (b.type === 4) - (a.type === 4) || a.position - b.position);
}

const webhookName = (a) =>
  String(a?.global_name || a?.username || "Usuario")
    .replace(/discord|clyde/gi, "d1sc0rd")
    .slice(0, 80) || "Usuario";

/**
 * Restaura una copia en el servidor.
 * @param {object} o { messages: true, deleteExtra: false, bans: false, log(text) }
 */
async function restoreBackup(rest, guildId, snapshot, o = {}) {
  const { messages = true, deleteExtra = false, bans = false, log = () => {} } = o;
  // De dónde salen los mensajes y archivos: la base de datos, o un archivo descargado con /backup descargar
  const source = o.source || { messages: store.channelMessages, file: store.getFile };
  const oldGuildId = snapshot.guild.id;
  const report = { rolesCreated: 0, rolesUpdated: 0, channelsCreated: 0, channelsUpdated: 0, emojis: 0, stickers: 0, memberRoles: 0, messages: 0, deleted: 0, bans: 0, unbans: 0, errors: [] };
  const err = (what, e) => report.errors.push(`${what}: ${e.message || e}`);

  // ---------- Roles
  log("Roles…");
  const currentRoles = await rest.get(Routes.guildRoles(guildId));
  const roleMap = new Map([[oldGuildId, guildId]]);
  for (const r of [...snapshot.roles].sort((a, b) => a.position - b.position)) {
    if (r.id === oldGuildId) {
      await rest.patch(Routes.guildRole(guildId, guildId), { body: { permissions: r.permissions } }).catch((e) => err("@everyone", e));
      continue;
    }
    const same = currentRoles.find((x) => x.id === r.id) || (r.managed ? currentRoles.find((x) => x.managed && x.name === r.name) : null);
    if (same) {
      roleMap.set(r.id, same.id);
      if (!r.managed && (same.name !== r.name || same.permissions !== r.permissions || same.color !== r.color || same.hoist !== r.hoist || same.mentionable !== r.mentionable)) {
        await rest
          .patch(Routes.guildRole(guildId, same.id), { body: { name: r.name, permissions: r.permissions, color: r.color, hoist: r.hoist, mentionable: r.mentionable } })
          .then(() => report.rolesUpdated++)
          .catch((e) => err(`rol ${r.name}`, e));
      }
      continue;
    }
    if (r.managed) continue; // los roles de bots los crea Discord al invitar el bot
    const created = await rest
      .post(Routes.guildRoles(guildId), { body: { name: r.name, permissions: r.permissions, color: r.color, hoist: r.hoist, mentionable: r.mentionable, unicode_emoji: r.unicode_emoji || undefined } })
      .catch((e) => err(`rol ${r.name}`, e));
    if (created) {
      roleMap.set(r.id, created.id);
      report.rolesCreated++;
    }
  }
  const positions = snapshot.roles.filter((r) => r.id !== oldGuildId && roleMap.has(r.id)).map((r) => ({ id: roleMap.get(r.id), position: r.position }));
  await rest.patch(Routes.guildRoles(guildId), { body: positions }).catch((e) => err("orden de los roles", e));

  // ---------- Canales
  log("Canales…");
  const currentChannels = await rest.get(Routes.guildChannels(guildId));
  const chanMap = new Map();
  const recreated = new Set();
  for (const c of sortChannels(snapshot.channels)) {
    const parent = c.parent_id ? chanMap.get(c.parent_id) || null : null;
    const body = {
      name: c.name,
      topic: c.topic ?? undefined,
      nsfw: c.nsfw,
      bitrate: c.bitrate,
      user_limit: c.user_limit,
      rate_limit_per_user: c.rate_limit_per_user,
      parent_id: c.type === 4 ? undefined : parent,
      permission_overwrites: remapOverwrites(c.permission_overwrites, roleMap, guildId, oldGuildId),
    };
    const same = currentChannels.find((x) => x.id === c.id);
    if (same) {
      chanMap.set(c.id, same.id);
      const changed = same.name !== c.name || (same.topic || null) !== (c.topic || null) || (c.type !== 4 && (same.parent_id || null) !== parent) || JSON.stringify(same.permission_overwrites) !== JSON.stringify(body.permission_overwrites);
      if (changed) await rest.patch(Routes.channel(same.id), { body }).then(() => report.channelsUpdated++).catch((e) => err(`canal ${c.name}`, e));
      continue;
    }
    let created = await rest.post(Routes.guildChannels(guildId), { body: { ...body, type: c.type } }).catch((e) => e);
    if (created instanceof Error && c.type === 5) created = await rest.post(Routes.guildChannels(guildId), { body: { ...body, type: 0 } }).catch((e) => e);
    if (created instanceof Error) { err(`canal ${c.name}`, created); continue; }
    chanMap.set(c.id, created.id);
    recreated.add(c.id);
    report.channelsCreated++;
  }
  const chPositions = snapshot.channels.filter((c) => chanMap.has(c.id)).map((c) => ({ id: chanMap.get(c.id), position: c.position }));
  await rest.patch(Routes.guildChannels(guildId), { body: chPositions }).catch((e) => err("orden de los canales", e));

  // ---------- Borrar lo que no estaba en la copia (opcional)
  if (deleteExtra) {
    log("Borrando canales y roles que no estaban en la copia…");
    const keepCh = new Set(chanMap.values());
    for (const c of await rest.get(Routes.guildChannels(guildId))) {
      if (!keepCh.has(c.id)) await rest.delete(Routes.channel(c.id)).then(() => report.deleted++).catch((e) => err(`borrar canal ${c.name}`, e));
    }
    const keepRoles = new Set(roleMap.values());
    for (const r of await rest.get(Routes.guildRoles(guildId))) {
      if (!keepRoles.has(r.id) && !r.managed && r.id !== guildId) await rest.delete(Routes.guildRole(guildId, r.id)).then(() => report.deleted++).catch((e) => err(`borrar rol ${r.name}`, e));
    }
  }

  // ---------- Ajustes del servidor
  log("Ajustes del servidor…");
  const g = snapshot.guild;
  const mapCh = (id) => (id ? chanMap.get(id) || null : null);
  const settings = {
    name: g.name,
    description: g.description,
    verification_level: g.verification_level,
    default_message_notifications: g.default_message_notifications,
    explicit_content_filter: g.explicit_content_filter,
    afk_timeout: g.afk_timeout,
    afk_channel_id: mapCh(g.afk_channel_id),
    system_channel_id: mapCh(g.system_channel_id),
    system_channel_flags: g.system_channel_flags,
    rules_channel_id: mapCh(g.rules_channel_id),
    public_updates_channel_id: mapCh(g.public_updates_channel_id),
    preferred_locale: g.preferred_locale,
  };
  if (snapshot.images.icon) settings.icon = dataUri(Buffer.from(snapshot.images.icon, "base64"), g.icon?.startsWith("a_") ? "image/gif" : "image/png");
  await rest.patch(Routes.guild(guildId), { body: settings }).catch((e) => err("ajustes del servidor", e));
  for (const k of ["banner", "splash", "discovery_splash"]) {
    if (snapshot.images[k]) await rest.patch(Routes.guild(guildId), { body: { [k]: dataUri(Buffer.from(snapshot.images[k], "base64")) } }).catch(() => {});
  }

  // ---------- Emojis y stickers que falten (por nombre)
  log("Emojis y stickers…");
  const curEmojis = await rest.get(Routes.guildEmojis(guildId));
  for (const e of snapshot.emojis) {
    if (!e.image || curEmojis.some((x) => x.id === e.id || x.name === e.name)) continue;
    await rest
      .post(Routes.guildEmojis(guildId), { body: { name: e.name, image: dataUri(Buffer.from(e.image, "base64"), e.animated ? "image/gif" : "image/png"), roles: (e.roles || []).map((id) => roleMap.get(id)).filter(Boolean) } })
      .then(() => report.emojis++)
      .catch((x) => err(`emoji ${e.name}`, x));
  }
  const curStickers = (await safe(rest.get(Routes.guildStickers(guildId)))) || [];
  for (const s of snapshot.stickers) {
    if (!s.image || s.format_type === 3 || curStickers.some((x) => x.name === s.name)) continue;
    const ext = s.format_type === 4 ? "gif" : "png";
    await rest
      .post(Routes.guildStickers(guildId), { body: { name: s.name, description: s.description || "", tags: s.tags || "⭐" }, files: [{ name: `sticker.${ext}`, data: Buffer.from(s.image, "base64"), contentType: `image/${ext}` }], appendToFormData: true })
      .then(() => report.stickers++)
      .catch((x) => err(`sticker ${s.name}`, x));
  }

  // ---------- Roles de los miembros que siguen en el servidor
  log("Roles de los miembros…");
  const present = (await safe(paged(rest, Routes.guildMembers(guildId), "user"))) || [];
  for (const m of snapshot.members) {
    const now = present.find((x) => x.user.id === m.id);
    if (!now) continue;
    for (const old of m.roles) {
      const id = roleMap.get(old);
      if (id && !now.roles.includes(id)) await rest.put(Routes.guildMemberRole(guildId, m.id, id)).then(() => report.memberRoles++).catch(() => {});
    }
  }

  // ---------- Baneos (opcional): dejar la lista como estaba en la copia
  if (bans) {
    log("Baneos…");
    const cur = (await safe(paged(rest, Routes.guildBans(guildId), "user"))) || [];
    const was = new Set(snapshot.bans.map((b) => b.id));
    for (const b of cur) if (!was.has(b.user.id)) await rest.delete(Routes.guildBan(guildId, b.user.id)).then(() => report.unbans++).catch(() => {});
    for (const b of snapshot.bans) if (!cur.some((x) => x.user.id === b.id)) await rest.put(Routes.guildBan(guildId, b.id), { body: {}, reason: b.reason || "Restaurado desde la copia" }).then(() => report.bans++).catch(() => {});
  }

  // ---------- Mensajes de los canales que hubo que volver a crear
  if (messages) {
    for (const c of snapshot.channels.filter((c) => recreated.has(c.id) && [0, 5].includes(c.type))) {
      log(`Mensajes de #${c.name}…`);
      report.messages += await repostChannel(rest, chanMap.get(c.id), await source.messages(c.id), (e) => err(`mensajes de #${c.name}`, e), null, source.file);
      // Hilos de ese canal: se crean de nuevo y se publican sus mensajes dentro
      for (const t of snapshot.threads.filter((t) => t.parent_id === c.id)) {
        const thread = await rest.post(Routes.threads(chanMap.get(c.id)), { body: { name: t.name, type: c.type === 5 ? 10 : 11, auto_archive_duration: 10080 } }).catch((e) => err(`hilo ${t.name}`, e));
        if (thread) report.messages += await repostChannel(rest, chanMap.get(c.id), await source.messages(t.id), (e) => err(`hilo ${t.name}`, e), thread.id, source.file);
      }
    }
  }
  return { report, roleMap, chanMap };
}

// Vuelve a publicar mensajes guardados con un webhook (nombre y foto de quien los escribió)
async function repostChannel(rest, channelId, records, onError, threadId, getFile = store.getFile) {
  if (!records.length) return 0;
  const hook = await rest.post(Routes.channelWebhooks(channelId), { body: { name: "Copia de seguridad" } }).catch((e) => (onError(e), null));
  if (!hook) return 0;
  let n = 0;
  try {
    for (const m of records) {
      if (![0, 19].includes(m.type)) continue; // solo mensajes normales y respuestas
      const files = [];
      for (const a of m.attachments) {
        const f = await getFile(a.id);
        if (f) files.push({ name: f.name, data: f.data, contentType: f.content_type || undefined });
      }
      let content = m.content || "";
      if (m.stickers.length) content += `${content ? "\n" : ""}*[sticker: ${m.stickers.map((s) => s.name).join(", ")}]*`;
      const lost = m.attachments.length - files.length;
      if (lost > 0) content += `${content ? "\n" : ""}*[${lost} archivo(s) que no se guardaron]*`;
      if (!content && !files.length && !m.embeds.length) continue;
      const query = new URLSearchParams({ wait: "true" });
      if (threadId) query.set("thread_id", threadId);
      await rest
        .post(Routes.webhook(hook.id, hook.token), {
          query,
          auth: false,
          body: {
            content: content.slice(0, 2000) || undefined,
            username: webhookName(m.author),
            avatar_url: m.author.avatar ? `${CDN}/avatars/${m.author.id}/${m.author.avatar}.png?size=128` : undefined,
            embeds: m.embeds.slice(0, 10),
            allowed_mentions: { parse: [] },
            attachments: files.map((f, i) => ({ id: i, filename: f.name })),
          },
          files,
        })
        .then(() => n++)
        .catch(onError);
    }
  } finally {
    await rest.delete(Routes.webhook(hook.id)).catch(() => {});
  }
  return n;
}

module.exports = { captureStructure, captureMessages, createBackup, exportBackup, importBackup, running, restoreBackup, repostChannel, remapOverwrites, sortChannels, webhookName, TEXT_TYPES, THREAD_TYPES };
