/*
 * Servidor de Discord simulado para las pruebas de verificación, tickets y reorganización (sin conectarse a Discord).
 * Imita lo que usa el bot: canales con permisos, categorías, posiciones, mensajes, roles y miembros.
 */
const { Collection, ChannelType, PermissionsBitField, PermissionFlagsBits } = require("discord.js");

let seq = 1000;
const nextId = () => String(++seq);

function fakeGuild({ id = "900000000000000555", ownerId = "1" } = {}) {
  const channels = new Collection();
  const roles = new Collection();
  const members = new Collection();
  const guild = { id, ownerId, name: "SampCity Pruebas", iconURL: () => null };
  const sent = []; // { channel, payload }

  function overwrites() {
    const cache = new Collection();
    return {
      cache,
      async edit(target, perms) {
        const tid = typeof target === "string" ? target : target.id;
        const cur = cache.get(tid) || { id: tid, allow: new PermissionsBitField(0n), deny: new PermissionsBitField(0n) };
        for (const [k, v] of Object.entries(perms)) {
          const bit = PermissionFlagsBits[k];
          if (v === true) {
            cur.allow = cur.allow.add(bit);
            cur.deny = cur.deny.remove(bit);
          } else if (v === false) {
            cur.deny = cur.deny.add(bit);
            cur.allow = cur.allow.remove(bit);
          } else {
            cur.allow = cur.allow.remove(bit);
            cur.deny = cur.deny.remove(bit);
          }
        }
        cache.set(tid, cur);
      },
    };
  }

  function mkChannel({ name, type = ChannelType.GuildText, parent = null, topic = null, permissionOverwrites = null }) {
    const cid = nextId();
    const msgs = new Collection();
    const parentId = typeof parent === "string" ? parent : parent?.id || null;
    const ch = {
      id: cid,
      name,
      type,
      topic,
      parentId,
      position: channels.filter((c) => c.parentId === parentId && (c.type === ChannelType.GuildCategory) === (type === ChannelType.GuildCategory)).size,
      lastMessageId: null,
      permissionOverwrites: overwrites(),
      toString: () => `<#${cid}>`,
      permissionsFor(role) {
        const ow = ch.permissionOverwrites.cache.get(role.id);
        const bits = new PermissionsBitField(PermissionsBitField.Default).add(PermissionFlagsBits.ViewChannel);
        let b = bits;
        if (ow) b = b.remove(ow.deny).add(ow.allow);
        return b;
      },
      async setName(n) { ch.name = n; return ch; },
      async setTopic(t) { ch.topic = t; return ch; },
      async setParent(pid) { ch.parentId = pid; return ch; },
      async delete() { channels.delete(cid); },
      async send(payload) {
        const m = { id: nextId(), author: { id: "bot" }, payload, createdTimestamp: Date.now(), components: [], async delete() { msgs.delete(m.id); }, async pin() {}, async edit(p) { m.payload = p; } };
        msgs.set(m.id, m);
        ch.lastMessageId = String((BigInt(Date.now() - 1420070400000) << 22n) + BigInt(seq));
        sent.push({ channel: ch, payload });
        return m;
      },
      messages: {
        cache: msgs,
        async fetch() { return msgs.clone(); },
        async delete(mid) { msgs.delete(mid); },
      },
      async bulkDelete(list) { for (const m of list.values()) msgs.delete(m.id); },
    };
    if (permissionOverwrites?.length) {
      for (const o of permissionOverwrites) {
        const allow = new PermissionsBitField(o.allow || []), deny = new PermissionsBitField(o.deny || []);
        ch.permissionOverwrites.cache.set(o.id, { id: o.id, allow, deny });
      }
    } else if (parentId && channels.get(parentId)) {
      for (const [k, v] of channels.get(parentId).permissionOverwrites.cache) ch.permissionOverwrites.cache.set(k, { ...v }); // sincronizado con la categoría
    }
    channels.set(cid, ch);
    return ch;
  }

  function mkRole(name, perms = 0n) {
    const rid = roles.size === 0 ? id : nextId();
    const role = { id: rid, name, permissions: new PermissionsBitField(perms), toString: () => `<@&${rid}>` };
    roles.set(rid, role);
    return role;
  }
  const everyone = mkRole("@everyone");

  guild.channels = {
    cache: channels,
    async create(o) { return mkChannel(o); },
    async setPositions(list) { for (const { channel, position } of list) if (channels.get(channel)) channels.get(channel).position = position; },
  };
  guild.roles = { cache: roles, everyone, async create({ name }) { return mkRole(name); } };
  guild.members = { cache: members, async fetch() { return members; } };

  function mkMember(uid, { username = `user${uid}`, roleNames = [], admin = false, nickname = null } = {}) {
    const rc = new Collection();
    for (const n of roleNames) { const r = roles.find((x) => x.name === n); if (r) rc.set(r.id, r); }
    const m = {
      id: uid,
      guild,
      nickname,
      manageable: true,
      displayName: nickname || username,
      user: { id: uid, bot: false, username, tag: username, toString: () => `<@${uid}>`, async send() { return true; } },
      permissions: new PermissionsBitField(admin ? PermissionFlagsBits.Administrator : 0n),
      roles: { cache: rc, async add(r) { rc.set(r.id, r); }, async remove(r) { rc.delete(r.id); } },
      async setNickname(n) { m.nickname = n; },
      async send() { return true; },
      toString: () => `<@${uid}>`,
    };
    members.set(uid, m);
    return m;
  }

  return { guild, channels, roles, members, sent, mkChannel, mkRole, mkMember, everyone };
}

module.exports = { fakeGuild };
