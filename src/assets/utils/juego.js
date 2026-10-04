/*
 * /juego (src/interactions/Command/juego.js): comandos del juego para el Fundador. Comprueba los datos, deja la acción
 * en discord_actions y espera unos segundos a que el gamemode la aplique (gamemodes/src/discord_link.pwn, cada 5 s).
 * Las respuestas son privadas (solo las ve quien usa el comando).
 */
const crypto = require("crypto");
const samp = require("../../database/samp");
const { COMMANDS, BY_SUB, FACTIONS, STAFF_LEVELS } = require("../data/juego");

const WAIT_MS = 12000;
const NAME_RE = /^[A-Za-z]{2,}_[A-Za-z]{2,}$/;

// Contraseña como SHA256_PassHash del juego: sha256(clave + salt) en hexadecimal y mayúsculas. Al entrar, el juego la
// pasa a bcrypt él solo. Así la clave nunca queda escrita en claro en la base de datos.
function hashPass(pass, salt = crypto.randomBytes(8).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 10).padEnd(10, "x")) {
  return { salt, hash: crypto.createHash("sha256").update(pass + salt).digest("hex").toUpperCase() };
}

// value y reason de cada acción, o { error }
async function prepare(cmd, interaction, target) {
  const int = (k) => interaction.options.getInteger(k);
  const str = (k) => (interaction.options.getString(k) || "").trim();
  switch (cmd.action) {
    case "cash":
    case "bank":
    case "addcoins": {
      const v = int("cantidad");
      if (!v) return { error: "La cantidad no puede ser 0" };
      if (cmd.action === "bank" && !target.bank_account) return { error: "No tiene cuenta del banco" };
      return { value: v };
    }
    case "setcash":
    case "setcoins":
    case "darnegro":
      return { value: int("cantidad") };
    case "setlevel":
      return { value: int("nivel") };
    case "setadmin":
      return { value: int("rango") };
    case "skin":
      return { value: int("skin") };
    case "vip":
      return { value: int("dias") };
    case "health":
    case "armour":
      return { value: int("valor") };
    case "setname": {
      const name = str("nuevo");
      if (!NAME_RE.test(name) || name.length > 23) return { error: "El nombre tiene que ser Nombre_Apellido (solo letras, máximo 23)" };
      const other = await samp.getPlayerByName(name);
      if (other && other.id !== target.id) return { error: `El nombre ${name} ya lo usa otra cuenta` };
      return { reason: name };
    }
    case "setpass": {
      const pass = str("nueva");
      if (pass.length < 6 || pass.length > 18) return { error: "La contraseña tiene que tener de 6 a 18 caracteres" };
      if (/[%\s]/.test(pass)) return { error: "La contraseña no puede tener espacios ni %" };
      const { salt, hash } = hashPass(pass);
      return { reason: `${salt}:${hash}` };
    }
    case "setfact": {
      const f = FACTIONS.find((x) => x.id === int("faccion"));
      const rank = int("rango");
      if (!f) return { error: "Facción no válida" };
      if (rank < 1 || rank > f.max) return { error: `En ${f.name} el rango va de 1 a ${f.max}` };
      return { value: f.id, reason: String(rank) };
    }
    case "weapon":
      return { value: int("arma"), reason: String(int("balas")) };
    case "kick":
      return { reason: str("razon") };
    case "anuncio":
      return { reason: str("mensaje") };
    default:
      return {};
  }
}

// Texto de lo que se hizo (sin la contraseña)
function describe(cmd, p, interaction) {
  const money = (n) => "$" + Number(n).toLocaleString("es-AR");
  switch (cmd.action) {
    case "cash": return `${p.value > 0 ? "Recibe" : "Pierde"} ${money(Math.abs(p.value))} en mano`;
    case "setcash": return `Dinero en mano: ${money(p.value)}`;
    case "bank": return `${p.value > 0 ? "Recibe" : "Pierde"} ${money(Math.abs(p.value))} en el banco`;
    case "addcoins": return `${p.value > 0 ? "Recibe" : "Pierde"} ${Math.abs(p.value)} CityCoins`;
    case "setcoins": return `CityCoins: ${p.value}`;
    case "setlevel": return `Nivel ${p.value}`;
    case "setadmin": return `Rango de staff: ${STAFF_LEVELS[p.value]}`;
    case "skin": return `Skin ${p.value}`;
    case "setname": return `Nombre nuevo: ${p.reason}`;
    case "setpass": return "Contraseña cambiada";
    case "setfact": return `${FACTIONS.find((f) => f.id === p.value).name}, rango ${p.reason}`;
    case "delfact": return "Fuera de su facción";
    case "vip": return `${p.value} días de VIP`;
    case "health": return `Vida ${p.value}`;
    case "armour": return `Chaleco ${p.value}`;
    case "revive": return "Revivido";
    case "freeze": return "Congelado";
    case "unfreeze": return "Descongelado";
    case "weapon": return `Arma ${p.value} con ${p.reason} balas`;
    case "darnegro": return `${money(p.value)} de dinero negro`;
    case "kick": return `Expulsado: ${p.reason}`;
    case "anuncio": return `Anuncio: ${p.reason}`;
    default: return cmd.sub;
  }
}

function help(client, interaction) {
  const lines = COMMANDS.map((c) => `\`/juego ${c.sub}\` · ${c.desc}`);
  return client.embed(
    {
      title: "🎮・Comandos del juego",
      desc:
        "Solo el **Fundador** (rango 9 en el juego, con la cuenta vinculada). Se aplican al momento si el jugador está " +
        "conectado y, los de la cuenta, también si no lo está.\n\n" +
        lines.join("\n") +
        "\n\nBan, tempban, cárcel, silencio, advertencias y Socio siguen en `/samp`.",
      type: "editreply",
    },
    interaction,
  );
}

async function run(client, interaction) {
  const me = await client.samp.admin(interaction, "juego");
  if (!me) return;
  const sub = interaction.options.getSubcommand();
  if (sub === "help") return help(client, interaction);
  const cmd = BY_SUB.get(sub);
  if (!cmd) return;

  let target = null;
  if (!cmd.noTarget) {
    target = await client.samp.target(interaction, me);
    if (!target) return;
    if (cmd.online && !Number(target.connected)) {
      return client.errNormal({ error: `${target.name} no está conectado: este comando solo funciona con el jugador en el servidor`, type: "editreply" }, interaction);
    }
  }
  const p = await prepare(cmd, interaction, target);
  if (p.error) return client.errNormal({ error: p.error, type: "editreply" }, interaction);

  let reason = p.reason || "";
  // la acción "kick" del gamemode muestra reason tal cual en un aviso
  if (cmd.action === "kick") reason = `Has sido expulsado por ${me.name} (Discord).\nRazon: ${reason}`;
  // "vip" usa by_name para esperar si el jugador está entrando (como la tienda): ahí va el nombre de la cuenta
  const byName = cmd.action === "vip" ? target.name : me.name;
  const id = await samp.queueGameAction(target ? target.id : 0, cmd.action, p.value || 0, reason, byName);
  const done = await samp.waitAction(id, WAIT_MS);

  const what = describe(cmd, p, interaction);
  return client.succNormal(
    {
      text: target ? `**${client.samp.name(target.name)}**: ${what}` : what,
      fields: [
        {
          name: "🎮┆Juego",
          value: done
            ? Number(target?.connected) ? "Aplicado (está conectado)" : "Aplicado"
            : "En cola: el servidor no respondió todavía (¿apagado?). Se aplicará en cuanto lo procese.",
          inline: true,
        },
      ],
      type: "editreply",
    },
    interaction,
  );
}

module.exports = { run, prepare, describe, hashPass, NAME_RE };
