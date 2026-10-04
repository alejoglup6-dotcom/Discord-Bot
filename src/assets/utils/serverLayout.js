/*
 * Reorganiza el Discord según el plano de src/assets/data/serverLayout.js (/reorganizar vista y /reorganizar aplicar).
 * Con dry = true solo devuelve la lista de lo que haría. Pasos:
 *  1. Busca cada canal del plano (por nombre nuevo o por "match") y cada categoría (por nombre nuevo, o la vieja que
 *     tenga más canales de esa categoría); crea lo que falte.
 *  2. Renombra, mueve y ordena categorías y canales (la categoría de tickets justo debajo de EMPIEZA AQUÍ).
 *  3. Permisos: EMPIEZA AQUÍ lo ve todo el mundo; todo lo demás que hoy ve @everyone pasa a verse solo con el rol de
 *     verificado. Lo que ya estaba oculto (staff, logs, facciones privadas) no se toca. Canales de solo lectura.
 *  4. Publica los mensajes nuevos (normas, verificación, soporte, primeros pasos). Con cleanMessages borra antes los
 *     mensajes que hubiera en esos canales (la copia de seguridad de /backup los guarda).
 *  5. Borra las categorías que hayan quedado vacías.
 */
const Discord = require("discord.js");
const { CATEGORIES, KEEP_VISIBLE } = require("../data/serverLayout");
const { norm } = require("./guildLookup");
const verification = require("./verification");
const messages = require("./serverMessages");
const Tickets = require("../../database/models/tickets");
const LayoutPosts = require("../../database/models/layoutPosts");

const T = Discord.ChannelType;
const MOVABLE = [T.GuildText, T.GuildAnnouncement, T.GuildForum, T.GuildVoice, T.GuildStageVoice];
const VIEW = Discord.PermissionFlagsBits.ViewChannel;

const everyoneCanView = (channel, guild) => {
  try {
    return channel.permissionsFor(guild.roles.everyone)?.has(VIEW) ?? true;
  } catch {
    return true;
  }
};

async function organize(client, guild, { dry = true, cleanMessages = true, log = () => {} } = {}) {
  const out = [];
  const say = (t) => {
    out.push(t);
    log(t);
  };
  const act = async (text, fn) => {
    say(text);
    if (dry) return null;
    try {
      return await fn();
    } catch (e) {
      say(`  ⚠️ ${e.message}`);
      return null;
    }
  };

  // ---------------------------------------------------------------- 0. rol de verificado y tickets
  let verified = verification.verifiedRole(guild);
  if (!verified) {
    verified = await act("crear el rol de verificado 👤 USUARIO", () => guild.roles.create({ name: "👤 USUARIO", color: "#2ecc71", reason: "Verificación" }));
    if (!verified && !dry) throw new Error("No hay rol de verificado y no se pudo crear");
  }
  const ticketConfig = await Tickets.findOne({ Guild: guild.id });
  const ticketCat = ticketConfig?.Category ? guild.channels.cache.get(ticketConfig.Category) : null;

  // ---------------------------------------------------------------- 1. buscar canales y categorías
  const all = [...guild.channels.cache.values()];
  const categories = all.filter((c) => c.type === T.GuildCategory);
  const movable = all.filter((c) => MOVABLE.includes(c.type) && (!ticketCat || c.parentId !== ticketCat.id));
  const used = new Set();
  const found = new Map(); // clave de canal -> canal
  for (const cat of CATEGORIES)
    for (const def of cat.channels || []) {
      const ch = movable.find((c) => !used.has(c.id) && c.name === def.name) || movable.find((c) => !used.has(c.id) && def.match.test(norm(c.name)));
      if (ch) {
        used.add(ch.id);
        found.set(def.key, ch);
      }
    }

  const catFor = new Map(); // clave de categoría -> categoría
  const usedCats = new Set(ticketCat ? [ticketCat.id] : []);
  for (const cat of CATEGORIES) {
    if (cat.tickets) {
      if (ticketCat) catFor.set(cat.key, ticketCat);
      continue;
    }
    let pick = categories.find((c) => !usedCats.has(c.id) && c.name === cat.name);
    if (!pick) {
      // la vieja que tenga más canales de esta categoría
      const count = new Map();
      for (const def of cat.channels) {
        const ch = found.get(def.key);
        if (ch?.parentId && !usedCats.has(ch.parentId)) count.set(ch.parentId, (count.get(ch.parentId) || 0) + 1);
      }
      const best = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
      pick = best ? guild.channels.cache.get(best[0]) : null;
      if (pick && KEEP_VISIBLE.test(norm(pick.name))) pick = null;
    }
    if (pick) {
      usedCats.add(pick.id);
      catFor.set(cat.key, pick);
    }
  }

  // ---------------------------------------------------------------- 2. categorías: crear, renombrar, ordenar
  for (const cat of CATEGORIES) {
    let c = catFor.get(cat.key);
    if (!c) {
      if (cat.tickets) continue;
      const needed = cat.channels.some((d) => found.get(d.key) || d.create);
      if (!needed) continue;
      const permissionOverwrites =
        cat.access === "verified" && verified
          ? [
              { id: guild.roles.everyone.id, deny: [VIEW] },
              { id: verified.id, allow: [VIEW] },
            ]
          : [];
      c = await act(`crear categoría ${cat.name}`, () => guild.channels.create({ name: cat.name, type: T.GuildCategory, permissionOverwrites, reason: "Reorganización" }));
      if (c) catFor.set(cat.key, c);
      continue;
    }
    if (c.name !== cat.name) await act(`renombrar categoría ${c.name} → ${cat.name}`, () => c.setName(cat.name, "Reorganización"));
  }
  const order = CATEGORIES.map((c) => catFor.get(c.key)).filter(Boolean);
  const others = categories.filter((c) => !order.includes(c)).sort((a, b) => a.position - b.position);
  const wanted = [...order, ...others];
  const current = [...categories].sort((a, b) => a.position - b.position);
  if (order.length && wanted.some((c, i) => current[i] !== c))
    await act(`ordenar categorías: ${order.map((c) => c.name).join(" › ")}`, () => guild.channels.setPositions(wanted.map((c, i) => ({ channel: c.id, position: i }))));

  // ---------------------------------------------------------------- 3. canales: crear, mover, renombrar, ordenar
  for (const cat of CATEGORIES) {
    if (cat.tickets) continue;
    const parent = catFor.get(cat.key);
    const inOrder = [];
    for (const def of cat.channels) {
      let ch = found.get(def.key);
      if (!ch && def.create) {
        ch = await act(`crear canal ${def.name} en ${cat.name}`, () => guild.channels.create({ name: def.name, type: T.GuildText, parent: parent?.id, topic: def.topic, reason: "Reorganización" }));
        if (ch) found.set(def.key, ch);
      } else if (ch) {
        if (parent && ch.parentId !== parent.id) await act(`mover ${ch.name} a ${cat.name}`, () => ch.setParent(parent.id, { lockPermissions: false, reason: "Reorganización" }));
        if (ch.name !== def.name) await act(`renombrar ${ch.name} → ${def.name}`, () => ch.setName(def.name, "Reorganización"));
        if (def.topic && "topic" in ch && ch.topic !== def.topic && [T.GuildText, T.GuildAnnouncement].includes(ch.type))
          await act(`tema de ${def.name}`, () => ch.setTopic(def.topic));
      }
      if (ch) inOrder.push(ch);
    }
    if (parent && inOrder.length && !dry) {
      const rest = guild.channels.cache.filter((c) => c.parentId === parent.id && !inOrder.includes(c)).sort((a, b) => a.position - b.position);
      await guild.channels.setPositions([...inOrder, ...rest.values()].map((c, i) => ({ channel: c.id, position: i }))).catch((e) => say(`  ⚠️ ${e.message}`));
    }
  }

  // ---------------------------------------------------------------- 4. permisos
  const everyone = guild.roles.everyone;
  const publicCat = catFor.get("inicio");
  const readOnlyIds = new Set();
  for (const cat of CATEGORIES) for (const def of cat.channels || []) if (def.readOnly && found.get(def.key)) readOnlyIds.add(found.get(def.key).id);

  if (publicCat) {
    if (!everyoneCanView(publicCat, guild)) await act(`${publicCat.name}: visible para todos`, () => publicCat.permissionOverwrites.edit(everyone, { ViewChannel: true }));
    for (const def of CATEGORIES[0].channels) {
      const ch = found.get(def.key);
      if (!ch) continue;
      if (!everyoneCanView(ch, guild)) await act(`${def.name}: visible para todos`, () => ch.permissionOverwrites.edit(everyone, { ViewChannel: true }));
    }
  }
  const skipParents = new Set([publicCat?.id, ticketCat?.id].filter(Boolean));
  const publicIds = new Set(CATEGORIES[0].channels.map((d) => found.get(d.key)?.id).filter(Boolean));
  for (const c of all) {
    if (c.id === publicCat?.id || c.id === ticketCat?.id || publicIds.has(c.id)) continue;
    if (skipParents.has(c.parentId)) continue;
    const parent = c.parentId ? guild.channels.cache.get(c.parentId) : null;
    if (KEEP_VISIBLE.test(norm(c.name)) || (parent && KEEP_VISIBLE.test(norm(parent.name)))) continue;
    if (c.type !== T.GuildCategory && !MOVABLE.includes(c.type)) continue;
    if (!everyoneCanView(c, guild)) continue; // ya oculto: staff, logs...
    await act(`${c.name}: solo verificados`, async () => {
      await c.permissionOverwrites.edit(everyone, { ViewChannel: false }, { reason: "Solo verificados" });
      await c.permissionOverwrites.edit(verified, { ViewChannel: true }, { reason: "Solo verificados" });
    });
  }
  for (const id of readOnlyIds) {
    const ch = guild.channels.cache.get(id);
    if (!ch || ![T.GuildText, T.GuildAnnouncement].includes(ch.type)) continue;
    const ow = ch.permissionOverwrites.cache.get(everyone.id);
    if (ow?.deny?.has(Discord.PermissionFlagsBits.SendMessages)) continue;
    await act(`${ch.name}: solo lectura`, async () => {
      await ch.permissionOverwrites.edit(everyone, { SendMessages: false, CreatePublicThreads: false, CreatePrivateThreads: false });
      if (verified) await ch.permissionOverwrites.edit(verified, { SendMessages: false });
    });
  }

  // ---------------------------------------------------------------- 5. mensajes
  const byKey = new Map(found);
  for (const cat of CATEGORIES)
    for (const def of cat.channels || []) {
      if (!def.post) continue;
      const ch = byKey.get(def.key);
      if (!ch || typeof ch.send !== "function") continue;
      const prev = await LayoutPosts.findOne({ Guild: guild.id, Slot: def.key });
      if (cleanMessages) {
        const msgs = await ch.messages?.fetch({ limit: 100 }).catch(() => null);
        if (msgs?.size) await act(`${def.name}: borrar ${msgs.size} mensaje(s) viejos`, () => removeMessages(ch, msgs));
      } else if (prev?.Messages) {
        const ids = JSON.parse(prev.Messages || "[]");
        await act(`${def.name}: borrar la versión anterior del mensaje del bot`, async () => {
          for (const id of ids) await ch.messages.delete(id).catch(() => {});
        });
      }
      const payloads = messages.build(def.post, guild, byKey);
      const sent = await act(`${def.name}: publicar ${def.post === "rules" ? "normas" : def.post === "guide" ? "primeros pasos" : def.post === "verify" ? "panel de verificación" : "panel de tickets"}`, async () => {
        const ids = [];
        for (const p of payloads) {
          const m = await ch.send(p);
          ids.push(m.id);
        }
        return ids;
      });
      if (sent && !dry) await LayoutPosts.findOneAndUpdate({ Guild: guild.id, Slot: def.key }, { $set: { Channel: ch.id, Messages: JSON.stringify(sent) } }, { upsert: true });
      if (def.ticketPanel && ticketConfig && ticketConfig.Channel !== ch.id && !dry) {
        ticketConfig.Channel = ch.id; // el panel de tickets ahora vive aquí
        await ticketConfig.save();
      }
    }

  // ---------------------------------------------------------------- 6. categorías vacías
  if (!dry)
    for (const c of guild.channels.cache.filter((x) => x.type === T.GuildCategory).values()) {
      if ([...catFor.values()].includes(c) || c.id === ticketCat?.id || KEEP_VISIBLE.test(norm(c.name))) continue;
      if (guild.channels.cache.some((x) => x.parentId === c.id)) continue;
      await act(`borrar categoría vacía ${c.name}`, () => c.delete("Reorganización: quedó vacía"));
    }
  else {
    const willEmpty = categories.filter((c) => ![...catFor.values()].includes(c) && c.id !== ticketCat?.id && !KEEP_VISIBLE.test(norm(c.name)) && all.filter((x) => x.parentId === c.id).every((x) => used.has(x.id)));
    for (const c of willEmpty) say(`borrar categoría vacía ${c.name}`);
  }
  return out;
}

async function removeMessages(channel, msgs) {
  const recent = msgs.filter((m) => Date.now() - m.createdTimestamp < 13 * 86400000);
  if (recent.size > 1 && typeof channel.bulkDelete === "function") await channel.bulkDelete(recent, true).catch(() => {});
  else for (const m of recent.values()) await m.delete().catch(() => {});
  for (const m of msgs.filter((m) => !recent.has(m.id)).values()) await m.delete().catch(() => {});
}

module.exports = { organize };
