/*
 * /montar: organiza el servidor de Discord y deja listos bienvenida, despedida, contadores, recompensas por
 * invitación y la Fortuna.
 *
 * - Busca cada canal por la configuración del bot (bienvenidas, sugerencias, tickets...) o por su nombre,
 *   y lo mueve a su categoría. Las categorías que ya existen se reutilizan y se renombran con el estilo nuevo.
 * - Crea solo lo que falta: canales de info (invitaciones y fortuna), el canal para jugar a la Fortuna,
 *   bienvenidas/despedidas, contadores y los roles de las recompensas.
 * - Publica (o actualiza) los mensajes de info de invitaciones y de la Fortuna.
 * - NUNCA borra canales, categorías ni roles. Los canales que no conoce se quedan donde están.
 *
 * plan() calcula los cambios sin tocar nada (vista previa); apply() los hace.
 */
const Discord = require("discord.js");
const catalog = require("../data/fortuna");
const inviteConfig = require("../data/invites");
const Layout = require("../../database/models/serverLayout");
const Stats = require("../../database/models/stats");
const Rewards = require("../../database/models/inviteRewards");
const { lastPrizeKey } = require("../../handlers/functions/fortunaPrizes");

const T = Discord.ChannelType;
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// Canal configurado en un modelo del bot (campo Channel salvo que se diga otro)
const fromModel = (model, field = "Channel") => ({ model, field });

// Orden y contenido de cada categoría. find: dónde buscar el canal; create: crearlo si no existe
const LAYOUT = [
  {
    key: "info",
    name: "📌 ・ INFORMACIÓN",
    match: /informacion|info|importante|bienvenida/,
    channels: [
      { key: "Rules", find: [/norma|regla|rules/] },
      { key: "Announcements", find: [/anuncio|novedad|announcement/] },
      { key: "welcome", find: [fromModel("welcomeChannels"), /bienvenid|welcome/], create: "🎍┆bienvenidas", readOnly: true },
      { key: "leave", find: [fromModel("leaveChannels"), /despedid|goodbye/], create: "👋┆despedidas", readOnly: true },
      { key: "InviteInfo", find: [/invitacion|recompensa/], create: "🎁┆invitaciones", readOnly: true },
    ],
  },
  {
    key: "stats",
    name: "📊 ・ ESTADÍSTICAS",
    match: /estadistica|stats|contador/,
    stats: true,
  },
  {
    key: "community",
    name: "💬 ・ COMUNIDAD",
    match: /comunidad|general|community|chat/,
    channels: [
      { key: "Chat", find: [/^chat$|^general$|\bchat\b|\bgeneral\b/] },
      { key: "clips", find: [/clip|media|foto|video|captura/] },
      { key: "suggestions", find: [fromModel("suggestionChannels"), /sugerencia/] },
      { key: "starboard", find: [fromModel("starboardChannels"), /destacad|starboard/] },
      { key: "reviews", find: [fromModel("reviewChannels"), /resena|review/] },
      { key: "birthdays", find: [fromModel("birthdaychannels"), /cumple/] },
      { key: "levels", find: [fromModel("levelChannels"), /nivel|level/] },
      { key: "boosts", find: [fromModel("boostChannels"), /booster|boost/] },
    ],
  },
  {
    key: "fortuna",
    name: "🕴️ ・ FORTUNA",
    match: /fortuna|economia|economy/,
    channels: [
      { key: "FortunaInfo", find: [/info fortuna|fortuna info|premios fortuna/], create: "💰┆info-fortuna", readOnly: true },
      { key: "FortunaChannel", find: [/^fortuna$|\bfortuna\b/], create: "🕴️┆fortuna" },
    ],
  },
  {
    key: "games",
    name: "🎮 ・ MINIJUEGOS",
    match: /minijuego|juegos|games/,
    channels: [
      { key: "count", find: [fromModel("countChannel"), /contar|count/] },
      { key: "guessNumber", find: [fromModel("guessNumber"), /adivina el numero|guess number/] },
      { key: "guessWord", find: [fromModel("guessWord"), /adivina la palabra|guess word/] },
      { key: "wordsnake", find: [fromModel("wordsnake"), /serpiente|snake/] },
    ],
  },
  {
    key: "support",
    name: "🎫 ・ SOPORTE",
    match: /soporte|ayuda|support/,
    channels: [{ key: "ticketPanel", find: [fromModel("tickets", "Channel"), /soporte|support/] }],
  },
  {
    key: "staff",
    name: "🔒 ・ STAFF",
    match: /staff|admin|moderacion|registro|logs/,
    private: true,
    channels: [
      { key: "logs", find: [fromModel("logChannels"), /server log|logs$/] },
      { key: "ticketLogs", find: [fromModel("tickets", "Logs"), /log ticket|ticket log/] },
    ],
  },
];

const STAT_COUNTERS = [
  ["Members", "👤 Miembros: …"],
  ["Boost", "💎 Boosts: …"],
  ["Channels", "🔧 Canales: …"],
  ["Roles", "👔 Roles: …"],
];

async function findConfigured(guild, spec) {
  const Model = require(`../../database/models/${spec.model}`);
  const data = await Model.findOne({ Guild: guild.id }).lean().catch(() => null);
  const id = data?.[spec.field];
  return id ? guild.channels.cache.get(id) || null : null;
}

async function locate(guild, entry, taken) {
  for (const f of entry.find) {
    if (f instanceof RegExp) {
      const ch = guild.channels.cache
        .filter((c) => (c.type === T.GuildText || c.type === T.GuildAnnouncement || c.type === T.GuildForum) && !taken.has(c.id))
        .sort((a, b) => a.rawPosition - b.rawPosition)
        .find((c) => f.test(norm(c.name)));
      if (ch) return ch;
    } else {
      const ch = await findConfigured(guild, f);
      if (ch && !taken.has(ch.id)) return ch;
    }
  }
  return null;
}

/**
 * Calcula lo que hay que hacer, sin tocar nada.
 */
async function plan(guild) {
  const taken = new Set();
  const categories = [];
  const usedCategories = new Set();
  const layoutSaved = (await Layout.findOne({ Guild: guild.id }).lean()) || {};

  for (const cat of LAYOUT) {
    const existing = guild.channels.cache
      .filter((c) => c.type === T.GuildCategory && !usedCategories.has(c.id))
      .sort((a, b) => a.rawPosition - b.rawPosition)
      .find((c) => c.name === cat.name || cat.match.test(norm(c.name)));
    if (existing) usedCategories.add(existing.id);
    const item = { ...cat, category: existing || null, items: [] };

    if (cat.stats) {
      const data = (await Stats.findOne({ Guild: guild.id }).lean()) || {};
      for (const [field, label] of STAT_COUNTERS) {
        const ch = data[field] && guild.channels.cache.get(data[field]);
        if (ch) taken.add(ch.id);
        item.items.push({ key: field, channel: ch || null, create: ch ? null : label, voice: true });
      }
    } else {
      for (const entry of cat.channels) {
        const ch = await locate(guild, entry, taken);
        if (ch) taken.add(ch.id);
        item.items.push({ ...entry, channel: ch, create: ch ? null : entry.create || null });
      }
    }
    categories.push(item);
  }

  // Roles de recompensas
  const roles = [];
  for (const tier of inviteConfig.TIERS) {
    const saved = await Rewards.findOne({ Guild: guild.id, Invites: tier.invites }).lean();
    const role = (saved && guild.roles.cache.get(saved.Role)) || guild.roles.cache.find((r) => r.name === tier.role) || null;
    roles.push({ tier, role });
  }
  const magnate =
    (layoutSaved.MagnateRole && guild.roles.cache.get(layoutSaved.MagnateRole)) ||
    guild.roles.cache.find((r) => r.name === catalog.MAGNATE_ROLE) ||
    null;

  // Categorías que quedarán vacías (no se borran; solo se avisa)
  const moving = new Set(categories.flatMap((c) => c.items.map((i) => i.channel?.id).filter(Boolean)));
  const leftEmpty = guild.channels.cache
    .filter((c) => c.type === T.GuildCategory && !usedCategories.has(c.id))
    .filter((c) => {
      const children = guild.channels.cache.filter((ch) => ch.parentId === c.id);
      return children.size > 0 && children.every((ch) => moving.has(ch.id));
    });

  return { categories, roles, magnate, leftEmpty: [...leftEmpty.values()] };
}

function describe(p) {
  const lines = [];
  for (const c of p.categories) {
    const head = c.category
      ? c.category.name === c.name
        ? `**${c.name}**`
        : `**${c.name}** (renombra "${c.category.name}")`
      : `**${c.name}** (nueva)`;
    lines.push(head);
    for (const i of c.items) {
      if (i.channel) {
        const moves = i.channel.parentId !== c.category?.id || !c.category;
        lines.push(`  ${moves ? "➡️" : "✔️"} ${i.channel.name}${moves ? " (se mueve aquí)" : ""}`);
      } else if (i.create) lines.push(`  ➕ ${i.create} (nuevo)`);
    }
  }
  const newRoles = p.roles.filter((r) => !r.role).map((r) => r.tier.role);
  if (!p.magnate) newRoles.push(catalog.MAGNATE_ROLE);
  if (newRoles.length) lines.push("", `**Roles nuevos:** ${newRoles.join(", ")}`);
  lines.push("", "**Mensajes:** info de invitaciones y de la Fortuna (se actualizan si ya estaban)");
  if (p.leftEmpty.length) lines.push("", `**Quedarán vacías (no se borran):** ${p.leftEmpty.map((c) => c.name).join(", ")}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------------------------------------------

function readOnlyOverwrites(guild) {
  return [
    { id: guild.roles.everyone.id, deny: [Discord.PermissionFlagsBits.SendMessages, Discord.PermissionFlagsBits.CreatePublicThreads], allow: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.ReadMessageHistory] },
    { id: guild.members.me.id, allow: [Discord.PermissionFlagsBits.SendMessages, Discord.PermissionFlagsBits.EmbedLinks, Discord.PermissionFlagsBits.AttachFiles, Discord.PermissionFlagsBits.ViewChannel] },
  ];
}

async function apply(client, guild) {
  const p = await plan(guild);
  const report = { created: [], moved: [], renamed: [], roles: [], errors: [] };
  const fail = (what, err) => report.errors.push(`${what}: ${err.message}`);
  const saved = {};
  const reason = "Montaje del servidor (/montar)";
  let position = 0;

  for (const c of p.categories) {
    let category = c.category;
    try {
      if (!category) {
        category = await guild.channels.create({
          name: c.name,
          type: T.GuildCategory,
          reason,
          permissionOverwrites: c.private ? [{ id: guild.roles.everyone.id, deny: [Discord.PermissionFlagsBits.ViewChannel] }, { id: guild.members.me.id, allow: [Discord.PermissionFlagsBits.ViewChannel] }] : undefined,
        });
        report.created.push(c.name);
      } else if (category.name !== c.name) {
        const old = category.name;
        await category.setName(c.name, reason);
        report.renamed.push(`${old} → ${c.name}`);
      }
      await category.setPosition(position++, { reason }).catch(() => {});
    } catch (err) {
      fail(c.name, err);
      continue;
    }

    let order = 0;
    for (const i of c.items) {
      let channel = i.channel;
      try {
        if (!channel && i.create) {
          const options = { name: i.create, parent: category.id, reason };
          if (i.voice) {
            options.type = T.GuildVoice;
            options.permissionOverwrites = [{ id: guild.roles.everyone.id, deny: [Discord.PermissionFlagsBits.Connect] }, { id: guild.members.me.id, allow: [Discord.PermissionFlagsBits.ManageChannels, Discord.PermissionFlagsBits.Connect] }];
          } else {
            options.type = T.GuildText;
            if (i.readOnly) options.permissionOverwrites = readOnlyOverwrites(guild);
          }
          channel = await guild.channels.create(options);
          report.created.push(i.create);
        } else if (channel && channel.parentId !== category.id) {
          await channel.setParent(category.id, { lockPermissions: false, reason });
          report.moved.push(`${channel.name} → ${c.name}`);
        }
        if (channel) {
          await channel.setPosition(order++, { reason }).catch(() => {});
          saved[i.key] = channel;
        }
      } catch (err) {
        fail(i.create || channel?.name || i.key, err);
      }
    }
  }

  // Configuración del bot con los canales montados
  const upsert = (name, fields) =>
    require(`../../database/models/${name}`).findOneAndUpdate({ Guild: guild.id }, { $set: fields }, { upsert: true });
  if (saved.welcome) await upsert("welcomeChannels", { Channel: saved.welcome.id });
  if (saved.leave) await upsert("leaveChannels", { Channel: saved.leave.id });
  const statFields = {};
  for (const [field] of STAT_COUNTERS) if (saved[field]) statFields[field] = saved[field].id;
  if (Object.keys(statFields).length) await upsert("stats", statFields);

  // Roles de recompensas y del magnate
  for (const r of p.roles) {
    try {
      let role = r.role;
      if (!role) {
        role = await guild.roles.create({ name: r.tier.role, color: r.tier.color, hoist: false, mentionable: false, reason });
        report.roles.push(role.name);
      }
      await Rewards.findOneAndUpdate({ Guild: guild.id, Invites: r.tier.invites }, { $set: { Role: role.id } }, { upsert: true });
      r.role = role;
    } catch (err) {
      fail(r.tier.role, err);
    }
  }
  let magnate = p.magnate;
  if (!magnate) {
    try {
      magnate = await guild.roles.create({ name: catalog.MAGNATE_ROLE, color: "#f5b041", hoist: true, reason });
      report.roles.push(magnate.name);
    } catch (err) {
      fail(catalog.MAGNATE_ROLE, err);
    }
  }

  const layoutFields = { MagnateRole: magnate?.id };
  for (const key of ["Rules", "Announcements", "InviteInfo", "FortunaInfo", "FortunaChannel", "Chat"]) if (saved[key]) layoutFields[key] = saved[key].id;
  const before = await Layout.findOne({ Guild: guild.id }).lean();
  // El primer reparto de premios es el próximo domingo, no el que ya pasó
  if (!before?.LastPrizeWeek) layoutFields.LastPrizeWeek = lastPrizeKey();
  await Layout.findOneAndUpdate({ Guild: guild.id }, { $set: layoutFields }, { upsert: true });

  // Mensajes de info
  if (saved.InviteInfo) await postInfo(client, saved.InviteInfo, inviteEmbeds(client, guild, p.roles, saved)).catch((e) => fail("info invitaciones", e));
  if (saved.FortunaInfo) await postInfo(client, saved.FortunaInfo, fortunaEmbeds(client, guild, magnate, saved)).catch((e) => fail("info fortuna", e));

  // Contadores al día
  if (client.refreshStats) await client.refreshStats(guild).catch(() => {});

  return { report, leftEmpty: p.leftEmpty };
}

// Publica los embeds o edita el mensaje del bot que ya los tenía (se reconoce por el título del primero)
async function postInfo(client, channel, embeds) {
  const title = embeds[0].data.title;
  const recent = await channel.messages.fetch({ limit: 30 }).catch(() => null);
  const mine = recent?.find((m) => m.author.id === client.user.id && m.embeds[0]?.title === title);
  if (mine) return mine.edit({ embeds });
  return channel.send({ embeds });
}

function base(client, title, color) {
  const e = client.templateEmbed().setTitle(title);
  if (color) e.setColor(color);
  return e;
}

function inviteEmbeds(client, guild, roles, saved) {
  const m = catalog.money;
  const p = client.config.discord.prefix;
  const tiers = roles
    .map((r) => `${r.role ? `<@&${r.role.id}>` : `**${r.tier.role}**`} · **${r.tier.invites}** invitaciones → ${m(r.tier.money)}`)
    .join("\n");
  return [
    base(client, "🎁・Recompensas por invitar", "#ff7a59").setDescription(
      `¡Trae a tus amigos a **${guild.name}** y gana premios!\n\n` +
        `💵 **${m(inviteConfig.PER_INVITE)}** de la Fortuna por cada persona que entre con tu invitación.\n` +
        `🏆 Y al llegar a cada nivel ganas un **rol** y un **premio extra**:\n\n${tiers}`,
    ),
    base(client, "📨・Cómo invitar", "#5865F2").addFields(
      {
        name: "1️⃣┆Crea tu invitación",
        value: "Toca el nombre del servidor → **Invitar gente** → en ajustes pon que **no caduque** y copia el enlace.",
      },
      { name: "2️⃣┆Compártela", value: "En tus redes, con amigos que jueguen SA-MP o en grupos de GTA." },
      {
        name: "3️⃣┆Mira tu progreso",
        value: `\`/invitaciones ver\` · \`${p}invitaciones ver\`\nRanking: \`/invitaciones clasificacion\` · \`${p}invitaciones clasificacion\``,
      },
      {
        name: "⚠️┆Reglas",
        value:
          `• Solo cuentan las cuentas de Discord con más de **${inviteConfig.MIN_ACCOUNT_DAYS} días**.\n` +
          "• Si alguien sale, se descuenta de tus invitaciones (el dinero ya cobrado no se quita).\n" +
          "• Cada persona paga una sola vez, aunque salga y vuelva a entrar.\n" +
          "• Usar cuentas falsas o spam para invitar = pérdida de premios y sanción.",
      },
    ),
  ];
}

function fortunaEmbeds(client, guild, magnate, saved) {
  const m = catalog.money;
  const p = client.config.discord.prefix;
  const play = saved.FortunaChannel ? `${saved.FortunaChannel}` : "el canal de la Fortuna";
  const jobs = catalog.JOBS.map((j) => `${j.emoji} **${j.name}** ${m(j.pay[0])}-${m(j.pay[1])} · ${j.cooldown} min`).join("\n");
  const cat = (id) =>
    catalog.CATEGORIES[id].items
      .map((i) => `${i.name} · ${m(i.price)}${i.income ? ` (+${m(i.income)}/h)` : ""}${i.bonus ? ` (+${i.bonus}%)` : ""}`)
      .join("\n");
  const prizes = catalog.WEEKLY_PRIZES.map((v, i) => `${["🥇", "🥈", "🥉"][i]} ${m(v)}`).join("  ");
  return [
    base(client, "🕴️・La Fortuna", "#f5b041").setDescription(
      `El minijuego de economía de **${guild.name}**: trabaja, compra propiedades, cobra sus ganancias y sube en el ranking. ` +
        `Se juega en ${play} con \`/fortuna\` o con \`${p}\`.\n*(Es de Discord: no cambia nada dentro del juego.)*`,
    ).addFields(
      {
        name: "🚀┆Cómo empezar",
        value:
          `1. Mira los oficios: \`${p}trabajos\`\n2. Firma uno: \`${p}contrato policia\`\n3. Trabaja: \`${p}trabajar\`\n` +
          `4. Compra: \`${p}autos\` y \`${p}cauto sultan\`\n5. Cobra lo que generan tus casas y negocios: \`${p}cobrar\`\n6. Mira tu fortuna: \`${p}fortuna\``,
      },
      {
        name: "🏆┆Premios semanales",
        value:
          `Cada **domingo a las ${catalog.PRIZE_HOUR}:00** las 3 mayores fortunas cobran:\n${prizes}\n` +
          (magnate ? `El primero se lleva el rol <@&${magnate.id}> hasta el domingo siguiente.\n` : "") +
          `Ranking: \`/fortuna top\` · \`${p}fortuna top\``,
      },
    ),
    base(client, "👷・Oficios", "#5dade2").setDescription(
      `${jobs}\n\n🚗 Taxista, repartidor y camionero necesitan un **auto**. 🔫 Policía necesita un **arma**.`,
    ),
    base(client, "🏘️・Propiedades y armas", "#58d68d").addFields(
      { name: "🚗┆Autos", value: cat("autos"), inline: true },
      { name: "🏡┆Casas", value: cat("casas"), inline: true },
      { name: "🏪┆Negocios", value: cat("negocios"), inline: false },
      { name: "🏢┆Empresas", value: cat("empresas"), inline: true },
      { name: "🔫┆Armas", value: cat("armas"), inline: true },
      {
        name: "💡┆Datos",
        value:
          `• Las ganancias por hora se acumulan hasta ${catalog.MAX_INCOME_HOURS} h: cobra seguido.\n` +
          `• Al vender recuperas el ${Math.round(catalog.SELL_RATE * 100)}%.\n` +
          `• \`${p}asaltar\` cada ${catalog.HEIST_COOLDOWN} min: tu mejor arma sube la probabilidad; si fallas, multa.`,
      },
    ),
  ];
}

module.exports = { plan, apply, describe, LAYOUT, inviteEmbeds, fortunaEmbeds };
