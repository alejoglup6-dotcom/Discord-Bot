const Discord = require("discord.js");
const db = require("../../database/mysql");
const samp = require("../../database/samp");
const { COLORS, brandEmbed, webButton } = require("../../assets/utils/brand");
const { textChannel } = require("../../assets/utils/guildLookup");

/*
 * Avisos de vacantes (tablas web_vacancies y web_applications que crea la web, /solicitar-staff):
 * - Vacante nueva de staff: embed en 📣 anuncios con título, descripción, requisitos y botón con el enlace directo.
 *   (alertas.js menciona solo el rol "🔔 Anuncios" cuando el bot publica ahí.)
 * - Postulación nueva (a cualquier vacante): embed en el canal de staff con las respuestas y botón para revisarla.
 *
 * Cada 20 segundos mira la base de datos. Lo ya avisado se guarda en bot_vacantes_avisos (por servidor), así no se
 * repite tras reiniciar. La primera vez en cada servidor solo marca lo que ya existía, sin avisar de lo viejo.
 *
 * .env (todo opcional):
 *   VACANTES = off          desactiva los avisos
 *   VACANTES_FACCIONES = on  avisa también las vacantes de facciones (por defecto solo las de staff)
 *   VACANTES_ANUNCIOS_CANAL  ID del canal de anuncios (si no, el que se llame "anuncios")
 *   VACANTES_STAFF_CANAL     ID del canal de postulaciones (por defecto 1552764859706376333; ya no se busca por nombre)
 *   WEB_URL                  dirección de la web (la misma que usa el resto del bot)
 */
const CADA = 20000;
const RE_ANUNCIOS = /^anuncios?$/;
const STAFF_CANAL_ID = "1552764859706376333"; // canal fijo donde llegan las postulaciones

const clip = (s, n) => {
  s = String(s || "").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
};
const jparse = (s) => {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

function canal(guild, envKey, pattern, idPorDefecto) {
  const id = process.env[envKey] || idPorDefecto;
  const porId = id && guild.channels.cache.get(id);
  if (porId) return porId;
  return pattern ? textChannel(guild, pattern) : null;
}

function embedVacante(guild, v) {
  const preguntas = jparse(v.questions).length;
  const campos = [];
  if (v.requirements) campos.push({ name: "Requisitos", value: clip(v.requirements, 1000) });
  const extra = [];
  extra.push(v.kind === "faction" && v.faction ? `Facción: **${clip(v.faction, 60)}**` : "Tipo: **Staff**");
  extra.push(v.slots > 0 ? `Cupos: **${v.slots}**` : "Cupos: **sin límite**");
  if (v.min_level > 0) extra.push(`Nivel mínimo: **${v.min_level}**`);
  if (v.need_discord) extra.push("Pide **Discord vinculado**");
  if (preguntas) extra.push(`**${preguntas}** pregunta${preguntas === 1 ? "" : "s"} para el postulante`);
  campos.push({ name: "Detalles", value: extra.join("\n") });
  const e = brandEmbed(guild, {
    title: `NUEVA VACANTE: ${clip(v.title, 200)}`,
    desc: clip(v.description, 1800) || "Hay una vacante abierta. Entra a la web para ver los detalles y postularte.",
    fields: campos,
    color: COLORS.red,
  });
  e.setURL(webButton("x", `/solicitar-staff#vac-${v.id}`).data.url);
  return e;
}

function embedPostulacion(guild, a, v, discordId) {
  const campos = [
    { name: "Postulante", value: `**${String(a.name).replace(/_/g, " ")}**${discordId ? ` · <@${discordId}>` : ""}`, inline: true },
    { name: "Vacante", value: clip(v.title, 200), inline: true },
    { name: "Nivel", value: String(Number(a.level) || 0), inline: true },
  ];
  for (const x of jparse(a.answers).slice(0, 8)) campos.push({ name: clip(x.q, 250), value: clip(x.a, 1000) || "—" });
  if (a.about) campos.push({ name: "Sobre el postulante", value: clip(a.about, 1000) });
  return brandEmbed(guild, {
    title: "NUEVA POSTULACIÓN",
    fields: campos.slice(0, 25),
    color: COLORS.warn,
    footer: `Solicitud #${a.id} · vacante #${v.id}`,
  });
}

module.exports = (client) => {
  let busy = false;
  let tabla = false;

  async function preparar() {
    if (tabla) return true;
    if (!(await samp.isAvailable())) return false;
    await db.query(`CREATE TABLE IF NOT EXISTS bot_vacantes_avisos (
      tipo VARCHAR(4) NOT NULL,
      ref_id INT NOT NULL,
      guild_id VARCHAR(20) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tipo, ref_id, guild_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    tabla = true;
    return true;
  }

  // Las tablas web_* las crea la web al arrancar: si aún no existen, se espera
  const hayWeb = async () =>
    Number(
      (
        await db.query(
          "SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('web_vacancies','web_applications')",
        )
      )[0].n,
    ) === 2;

  // Primera vez en este servidor: lo que ya existe se da por avisado
  async function linea_base(guild) {
    const hecho = async (t) =>
      (await db.query("SELECT 1 FROM bot_vacantes_avisos WHERE tipo = ? AND ref_id = 0 AND guild_id = ?", [t, guild.id])).length > 0;
    if (!(await hecho("init"))) {
      // Las postulaciones y vacantes cerradas que ya existían no se avisan; las vacantes abiertas sí (una vez)
      await db.query("INSERT IGNORE INTO bot_vacantes_avisos (tipo, ref_id, guild_id) SELECT 'vac', id, ? FROM web_vacancies WHERE open = 0", [guild.id]);
      await db.query("INSERT IGNORE INTO bot_vacantes_avisos (tipo, ref_id, guild_id) SELECT 'app', id, ? FROM web_applications", [guild.id]);
      await db.query("INSERT IGNORE INTO bot_vacantes_avisos (tipo, ref_id, guild_id) VALUES ('init', 0, ?)", [guild.id]);
    }
    // Arreglo de la primera versión, que daba por avisadas también las vacantes abiertas: se desmarcan una vez
    if (!(await hecho("ini2"))) {
      await db.query(
        "DELETE a FROM bot_vacantes_avisos a JOIN web_vacancies v ON v.id = a.ref_id WHERE a.tipo = 'vac' AND a.guild_id = ? AND v.open = 1",
        [guild.id],
      );
      await db.query("INSERT IGNORE INTO bot_vacantes_avisos (tipo, ref_id, guild_id) VALUES ('ini2', 0, ?)", [guild.id]);
      console.log(`[vacantes] ${guild.name}: listo, se anunciarán las vacantes abiertas y las postulaciones nuevas`);
    }
  }

  const marcar = (tipo, id, guild) =>
    db.query("INSERT IGNORE INTO bot_vacantes_avisos (tipo, ref_id, guild_id) VALUES (?, ?, ?)", [tipo, id, guild.id]);

  async function pendientes(tipo, guild, filas) {
    if (!filas.length) return [];
    const ya = await db.query("SELECT ref_id FROM bot_vacantes_avisos WHERE tipo = ? AND guild_id = ? AND ref_id IN (?)", [
      tipo,
      guild.id,
      filas.map((f) => f.id),
    ]);
    const set = new Set(ya.map((r) => Number(r.ref_id)));
    return filas.filter((f) => !set.has(Number(f.id)));
  }

  async function avisarVacantes(guild) {
    const ch = canal(guild, "VACANTES_ANUNCIOS_CANAL", RE_ANUNCIOS);
    if (!ch) return; // sin canal no se marca nada: avisará cuando exista
    const tipos = process.env.VACANTES_FACCIONES === "on" ? "('staff','faction')" : "('staff')";
    const filas = await db.query(`SELECT * FROM web_vacancies WHERE open = 1 AND kind IN ${tipos} ORDER BY id DESC LIMIT 20`);
    for (const v of (await pendientes("vac", guild, filas)).reverse()) {
      const botones = new Discord.ActionRowBuilder().addComponents(
        webButton("Ver vacante y postularme", `/solicitar-staff#vac-${v.id}`, "📋"),
      );
      const ok = await ch.send({ embeds: [embedVacante(guild, v)], components: [botones] }).catch((e) => {
        console.log("[vacantes] anuncio:", e.message);
        return null;
      });
      if (ok) await marcar("vac", v.id, guild);
    }
  }

  async function avisarPostulaciones(guild) {
    const ch = canal(guild, "VACANTES_STAFF_CANAL", null, STAFF_CANAL_ID);
    if (!ch) return;
    const filas = await db.query(
      `SELECT a.id, a.vacancy_id, a.player_id, a.name, a.answers, a.about, a.created_at, p.level
       FROM web_applications a LEFT JOIN player p ON p.id = a.player_id ORDER BY a.id DESC LIMIT 30`,
    );
    for (const a of (await pendientes("app", guild, filas)).reverse()) {
      const v = (await db.query("SELECT id, title FROM web_vacancies WHERE id = ?", [a.vacancy_id]))[0];
      if (!v) {
        await marcar("app", a.id, guild); // vacante borrada
        continue;
      }
      const link = (await db.query("SELECT discord_id FROM discord_links WHERE player_id = ?", [a.player_id]).catch(() => []))[0];
      const botones = new Discord.ActionRowBuilder().addComponents(
        webButton("Revisar solicitudes", `/solicitar-staff#apps-${v.id}`, "🗂️"),
      );
      const ok = await ch
        .send({ embeds: [embedPostulacion(guild, a, v, link?.discord_id)], components: [botones], allowedMentions: { parse: [] } })
        .catch((e) => {
          console.log("[vacantes] postulación:", e.message);
          return null;
        });
      if (ok) await marcar("app", a.id, guild);
    }
  }

  async function run() {
    if (process.env.VACANTES === "off" || busy) return;
    busy = true;
    try {
      if (!(await preparar()) || !(await hayWeb())) return;
      for (const guild of client.guilds.cache.values()) {
        if (process.env.RANGOS_GUILD && guild.id !== process.env.RANGOS_GUILD) continue;
        try {
          await linea_base(guild);
          await avisarVacantes(guild);
          await avisarPostulaciones(guild);
        } catch (e) {
          console.log(`[vacantes] ${guild.name}:`, e.message);
        }
      }
    } catch (e) {
      console.log("[vacantes]", e.message);
    } finally {
      busy = false;
    }
  }

  client.vacantesSync = run;
  client.once(Discord.Events.ClientReady, () => {
    setTimeout(run, 25000);
    setInterval(run, CADA);
  });
};
