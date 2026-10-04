const Discord = require("discord.js");

const samp = require("../../database/samp");
const SampSync = require("../../database/models/sampSync");

/*
 * Rangos y sanciones sincronizados entre el juego y Discord (idea del staff, 30-sep-2026), solo con cuentas
 * vinculadas (/samp link):
 *  Juego -> Discord (cada 2 minutos):
 *   - VIP del juego activo -> rol "👑 VIP" (el mismo de los rangos, src/assets/data/rangos.js; se crea si falta). Se quita al caducar, solo si lo puso el bot.
 *   - Silenciado en el juego -> aislamiento (timeout) en Discord hasta que acabe (máximo 28 días, lo que deja Discord).
 *   - Baneado en el juego -> baneo en Discord si es permanente, aislamiento si es temporal. Al desbanear en el juego
 *     se quita. Los baneos que ya existían antes de activar esto no se tocan (marca "base").
 *  Discord -> juego (al momento):
 *   - Baneo o desbaneo en Discord -> baneo permanente / desbaneo de la cuenta del juego.
 *   - Aislamiento puesto o quitado en Discord -> silencio del canal de dudas en el juego (máximo 1440 min, como /muteard).
 *  Lo que hace el propio bot no vuelve a reflejarse (se ignora durante unos segundos y se comprueba el registro de auditoría).
 */
const EVERY = 2 * 60000;
const MAX_TIMEOUT = 28 * 24 * 3600 * 1000 - 60000;
const VIP_ROLE = require("../../assets/data/rangos").VIP_ROLE; // "👑 VIP" (el duplicado 💎 VIP se borra)

module.exports = (client) => {
  const acting = new Map(); // discordId -> hasta cuándo ignorar sus eventos (los provoca el bot)
  const mark = (id) => acting.set(id, Date.now() + 20000);
  const isMine = (id) => (acting.get(id) || 0) > Date.now();

  const record = (guild, player, kind) => SampSync.findOne({ Guild: guild.id, Player: player, Kind: kind });

  async function vipRole(guild) {
    let role = guild.roles.cache.find((r) => r.name === VIP_ROLE);
    if (!role) {
      role = await guild.roles
        .create({ name: VIP_ROLE, color: 0xf5c518, hoist: true, reason: "VIP del servidor de SA-MP" })
        .catch((e) => console.log("[sampSync] no se pudo crear el rol VIP:", e.message));
    }
    return role || null;
  }

  async function syncGuild(guild) {
    // primera vez en este servidor: los baneos que ya hay no se llevan a Discord
    let base = await SampSync.findOne({ Guild: guild.id, Kind: "base" });
    if (!base) {
      base = await new SampSync({ Guild: guild.id, Player: 0, Kind: "base", Ref: await samp.getMaxBanId(), Date: Date.now() }).save();
      console.log(`[sampSync] ${guild.name}: empieza; baneos del juego hasta el #${base.Ref} no se tocan`);
    }
    const role = await vipRole(guild);
    const rows = await samp.getSyncRows();
    const bans = await samp.getLinkedBans();
    const nowMs = Date.now();

    for (const r of rows) {
      const member = await guild.members.fetch(r.discord_id).catch(() => null);

      // VIP
      if (member && role) {
        const vipRec = await record(guild, r.player_id, "vip");
        if (Number(r.vip_on) && !member.roles.cache.has(role.id)) {
          await member.roles.add(role, "VIP en el servidor de SA-MP").catch(() => {});
          if (!vipRec) await new SampSync({ Guild: guild.id, Player: r.player_id, Kind: "vip", Ref: 1, Date: nowMs }).save();
        } else if (!Number(r.vip_on) && vipRec) {
          if (member.roles.cache.has(role.id)) await member.roles.remove(role, "Se acabó el VIP del servidor").catch(() => {});
          await vipRec.deleteOne();
        }
      }

      // Baneo del juego
      const ban = bans.get(r.player_id);
      const banRec = await record(guild, r.player_id, "ban");
      if (ban && ban.banId > base.Ref && (!banRec || banRec.Ref !== ban.banId)) {
        mark(r.discord_id);
        let mode = "ban";
        if (ban.expires) {
          mode = "timeout";
          if (member) await member.timeout(Math.min(ban.expires * 1000 - nowMs, MAX_TIMEOUT), `Baneado temporalmente en el juego (${r.name})`).catch(() => {});
        } else {
          await guild.members.ban(r.discord_id, { reason: `Baneado en el servidor de SA-MP (${r.name})` }).catch(() => {});
        }
        if (banRec) await banRec.deleteOne();
        await new SampSync({ Guild: guild.id, Player: r.player_id, Kind: "ban", Ref: ban.banId, Mode: mode, Date: nowMs }).save();
        continue;
      }
      if (!ban && banRec && banRec.Mode !== "discord") {
        mark(r.discord_id);
        if (banRec.Mode === "ban") await guild.members.unban(r.discord_id, "Desbaneado en el servidor de SA-MP").catch(() => {});
        else if (member) await member.timeout(null, "Fin del baneo en el juego").catch(() => {});
        await banRec.deleteOne();
      }
      if (ban) continue;

      // Silencio del juego
      if (!member) continue;
      const muteEnd = Number(r.mute) * 1000;
      const muteRec = await record(guild, r.player_id, "mute");
      const timedOut = member.communicationDisabledUntilTimestamp || 0;
      if (muteEnd > nowMs) {
        if (timedOut < muteEnd - 60000 && timedOut < nowMs + MAX_TIMEOUT - 60000) {
          mark(r.discord_id);
          await member.timeout(Math.min(muteEnd - nowMs, MAX_TIMEOUT), `Silenciado en el servidor de SA-MP (${r.name})`).catch(() => {});
        }
        if (!muteRec) await new SampSync({ Guild: guild.id, Player: r.player_id, Kind: "mute", Ref: Number(r.mute), Date: nowMs }).save();
      } else if (muteRec) {
        // si el aislamiento lo puso un moderador en Discord, se queda hasta que acabe alli
        if (timedOut > nowMs && muteRec.Mode !== "discord") {
          mark(r.discord_id);
          await member.timeout(null, "Fin del silencio en el juego").catch(() => {});
        }
        await muteRec.deleteOne();
      }
    }
  }

  async function syncAll() {
    if (!(await samp.isAvailable())) return;
    for (const guild of client.guilds.cache.values()) await syncGuild(guild).catch((e) => console.log("[sampSync]", e.message));
  }

  client.sampSyncNow = syncAll; // pruebas

  client.once(Discord.Events.ClientReady, () => {
    setTimeout(() => {
      syncAll();
      setInterval(syncAll, EVERY);
    }, 45000);
  });

  // Quién lo hizo, según el registro de auditoría (null si fue el bot o no se sabe)
  async function executor(guild, type, targetId) {
    const logs = await guild.fetchAuditLogs({ type, limit: 5 }).catch(() => null);
    const entry = logs?.entries.find((e) => e.target?.id === targetId && Date.now() - e.createdTimestamp < 30000);
    if (!entry || entry.executor?.id === client.user.id) return null;
    return entry;
  }

  async function adminFor(entry) {
    const linked = entry?.executor ? await samp.getLinkedPlayer(entry.executor.id) : null;
    if (linked) return linked;
    return { id: 0, name: (entry?.executor?.username || "Discord").slice(0, 24) };
  }

  // Baneo en Discord -> baneo permanente en el juego
  client.on(Discord.Events.GuildBanAdd, async (ban) => {
    if (isMine(ban.user.id) || !(await samp.isAvailable())) return;
    const target = await samp.getLinkedPlayer(ban.user.id);
    if (!target || (await samp.getActiveBan(target))) return;
    const entry = await executor(ban.guild, Discord.AuditLogEvent.MemberBanAdd, ban.user.id);
    if (!entry) return;
    const admin = await adminFor(entry);
    const reason = `Baneado en Discord: ${(entry.reason || "sin razon").replace(/[\r\n]+/g, " ")}`.slice(0, 80);
    await samp.ban(target, admin, reason, 0).catch((e) => console.log("[sampSync] ban:", e.message));
    const ids = await samp.getLinkedBans();
    const b = ids.get(target.id);
    if (b) await new SampSync({ Guild: ban.guild.id, Player: target.id, Kind: "ban", Ref: b.banId, Mode: "discord", Date: Date.now() }).save();
    console.log(`[sampSync] baneo de Discord llevado al juego: ${target.name}`);
  });

  // Desbaneo en Discord -> desbaneo en el juego
  client.on(Discord.Events.GuildBanRemove, async (ban) => {
    if (isMine(ban.user.id) || !(await samp.isAvailable())) return;
    const target = await samp.getLinkedPlayer(ban.user.id);
    if (!target) return;
    const entry = await executor(ban.guild, Discord.AuditLogEvent.MemberBanRemove, ban.user.id);
    if (!entry) return;
    const admin = await adminFor(entry);
    await samp.unban(target, admin).catch((e) => console.log("[sampSync] unban:", e.message));
    await SampSync.deleteOne({ Guild: ban.guild.id, Player: target.id, Kind: "ban" });
    console.log(`[sampSync] desbaneo de Discord llevado al juego: ${target.name}`);
  });

  // Aislamiento en Discord -> silencio del canal de dudas en el juego
  client.on(Discord.Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const before = oldMember.communicationDisabledUntilTimestamp || 0;
    const after = newMember.communicationDisabledUntilTimestamp || 0;
    if (before === after || isMine(newMember.id)) return;
    if (!(await samp.isAvailable())) return;
    const target = await samp.getLinkedPlayer(newMember.id);
    if (!target) return;
    const entry = await executor(newMember.guild, Discord.AuditLogEvent.MemberUpdate, newMember.id);
    if (!entry) return;
    const admin = await adminFor(entry);
    if (after > Date.now()) {
      const minutes = Math.min(1440, Math.max(1, Math.ceil((after - Date.now()) / 60000)));
      const reason = `Aislado en Discord: ${(entry.reason || "sin razon").replace(/[\r\n]+/g, " ")}`.slice(0, 80);
      const until = await samp.setMute(target, admin, minutes, reason).catch(() => 0);
      if (until) {
        await SampSync.deleteOne({ Guild: newMember.guild.id, Player: target.id, Kind: "mute" });
        await new SampSync({ Guild: newMember.guild.id, Player: target.id, Kind: "mute", Ref: until, Mode: "discord", Date: Date.now() }).save();
      }
    } else {
      if (await samp.isMuted(target)) await samp.setMute(target, admin, 0, "").catch(() => {});
      await SampSync.deleteOne({ Guild: newMember.guild.id, Player: target.id, Kind: "mute" });
    }
  });
};
