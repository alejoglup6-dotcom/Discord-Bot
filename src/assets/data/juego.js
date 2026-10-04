/*
 * /juego: comandos del juego que el Fundador (admin_level 9 en el juego, con la cuenta vinculada) puede usar desde
 * Discord. Cada uno deja una fila en discord_actions y el gamemode la aplica (gamemodes/src/discord_link.pwn,
 * DiscordAdmin_Apply, repo Backup): si se cambia una acción aquí, cambiarla también allí.
 *  - action: nombre de la acción en discord_actions (máximo 15 letras).
 *  - online: solo con el jugador conectado (vida, armas...). Las demás se aplican conectado o no.
 *  - opts: opciones del comando además de "name" (el jugador). type: int | string | choice.
 * Lo que ya está en /samp (ban, tempban, jail, mute, advertir, socio) no se repite.
 */

// Facciones del juego (faction_info de snrp.pwn) y su rango más alto (FactionMaxRank)
const FACTIONS = [
  { id: 1, name: "LSPD", max: 12 },
  { id: 2, name: "FBI", max: 8 },
  { id: 3, name: "SAEM", max: 12 },
  { id: 4, name: "LSSD (Sheriff)", max: 9 },
  { id: 5, name: "CITYTV", max: 3 },
  { id: 6, name: "Gobierno", max: 4 },
  { id: 7, name: "EMS", max: 8 },
];

// Igual que ADMIN_LEVELS de snrp.pwn
const STAFF_LEVELS = [
  "Ciudadano",
  "Soporte",
  "Ayudante",
  "Moderador",
  "Moderador Global",
  "Administrador",
  "Encargado de Staff",
  "Desarrollador",
  "Co-Fundador",
  "Fundador",
];

const MONEY = { min: -1000000000, max: 1000000000 };

const COMMANDS = [
  { sub: "dinero", desc: "Da (o quita, en negativo) dinero en mano", action: "cash",
    opts: [{ name: "cantidad", type: "int", desc: "Cantidad (negativa para quitar)", ...MONEY }] },
  { sub: "fijardinero", desc: "Pone el dinero en mano a una cantidad exacta", action: "setcash",
    opts: [{ name: "cantidad", type: "int", desc: "Dinero en mano", min: 0, max: MONEY.max }] },
  { sub: "banco", desc: "Da (o quita) dinero de su cuenta del banco", action: "bank",
    opts: [{ name: "cantidad", type: "int", desc: "Cantidad (negativa para quitar)", ...MONEY }] },
  { sub: "coins", desc: "Da (o quita) CityCoins", action: "addcoins",
    opts: [{ name: "cantidad", type: "int", desc: "CityCoins (negativo para quitar)", min: -1000000, max: 1000000 }] },
  { sub: "fijarcoins", desc: "Pone los CityCoins a una cantidad exacta", action: "setcoins",
    opts: [{ name: "cantidad", type: "int", desc: "CityCoins", min: 0, max: 1000000 }] },
  { sub: "nivel", desc: "Cambia el nivel", action: "setlevel",
    opts: [{ name: "nivel", type: "int", desc: "Nivel nuevo", min: 1, max: 500 }] },
  { sub: "staff", desc: "Cambia el rango de staff (Discord se pone solo con la sincronización)", action: "setadmin",
    opts: [{ name: "rango", type: "choice", desc: "Rango de staff", choices: STAFF_LEVELS.map((n, i) => ({ name: `${i} · ${n}`, value: i })) }] },
  { sub: "skin", desc: "Cambia la skin", action: "skin",
    opts: [{ name: "skin", type: "int", desc: "Id de la skin (0-311)", min: 0, max: 311 }] },
  { sub: "nombre", desc: "Cambia el nombre de la cuenta", action: "setname",
    opts: [{ name: "nuevo", type: "string", desc: "Nombre nuevo (Nombre_Apellido)", maxLength: 23 }] },
  { sub: "clave", desc: "Cambia la contraseña de la cuenta (no se muestra a nadie)", action: "setpass",
    opts: [{ name: "nueva", type: "string", desc: "Contraseña nueva (6 a 18 caracteres)", maxLength: 18 }] },
  { sub: "faccion", desc: "Mete en una facción o cambia el rango", action: "setfact",
    opts: [
      { name: "faccion", type: "choice", desc: "Facción", choices: FACTIONS.map((f) => ({ name: f.name, value: f.id })) },
      { name: "rango", type: "int", desc: "Rango dentro de la facción (1 = el más bajo)", min: 1, max: 12 },
    ] },
  { sub: "quitarfaccion", desc: "Saca de su facción", action: "delfact", opts: [] },
  { sub: "vip", desc: "Da días de VIP (se suman a los que tenga)", action: "vip",
    opts: [{ name: "dias", type: "int", desc: "Días de VIP", min: 1, max: 3650 }] },
  { sub: "vida", desc: "Pone la vida (tiene que estar conectado)", action: "health", online: true,
    opts: [{ name: "valor", type: "int", desc: "0 a 100", min: 0, max: 100 }] },
  { sub: "chaleco", desc: "Pone el chaleco (tiene que estar conectado)", action: "armour", online: true,
    opts: [{ name: "valor", type: "int", desc: "0 a 100", min: 0, max: 100 }] },
  { sub: "revivir", desc: "Revive a un herido (tiene que estar conectado)", action: "revive", online: true, opts: [] },
  { sub: "congelar", desc: "Congela al jugador (tiene que estar conectado)", action: "freeze", online: true, opts: [] },
  { sub: "descongelar", desc: "Descongela al jugador (tiene que estar conectado)", action: "unfreeze", online: true, opts: [] },
  { sub: "arma", desc: "Da un arma al inventario (tiene que estar conectado)", action: "weapon", online: true,
    opts: [
      { name: "arma", type: "int", desc: "Id del arma (como /arma)", min: 1, max: 46 },
      { name: "balas", type: "int", desc: "Balas", min: 1, max: 9999 },
    ] },
  { sub: "dineronegro", desc: "Da dinero negro (tiene que estar conectado)", action: "darnegro", online: true,
    opts: [{ name: "cantidad", type: "int", desc: "Cantidad", min: 1, max: 100000000 }] },
  { sub: "expulsar", desc: "Expulsa del servidor (tiene que estar conectado)", action: "kick", online: true,
    opts: [{ name: "razon", type: "string", desc: "Razón", maxLength: 80 }] },
  { sub: "anuncio", desc: "Manda un anuncio a todo el servidor (* Admin: ...)", action: "anuncio", noTarget: true,
    opts: [{ name: "mensaje", type: "string", desc: "Mensaje", maxLength: 120 }] },
];

const BY_SUB = new Map(COMMANDS.map((c) => [c.sub, c]));

module.exports = { COMMANDS, BY_SUB, FACTIONS, STAFF_LEVELS };
