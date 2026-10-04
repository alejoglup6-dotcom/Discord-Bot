/*
 * Rangos unificados juego <-> Discord (tabla completa: docs/rangos/tabla-rangos.md).
 * RANKS es la lista jerárquica (el primero es el más alto) y tiene las MISMAS claves que RANGOS de
 * gamemodes/src/rangos.pwn (repo Backup): si se cambia una, cambiar la otra.
 *
 * mode:
 *  - "auto":    sale de los datos del juego; el bot pone o quita el rol a las cuentas vinculadas.
 *  - "manual":  se da a mano (en el juego con /darrango o en Discord con el rol); se copia al otro lado (player_ranks).
 *  - "ref":     escalón de invitados (invitaciones de Discord + referidos del juego); el bot solo lo agrega.
 *  - "pending": aún no existe en el juego: el bot no lo toca (hoy no queda ninguno).
 * role: nombre exacto del rol en Discord; color: solo para los roles que el bot tiene que crear.
 * group: rol que se da además (el de la facción o el de miembro de banda).
 */
const RANKS = [
  { key: "staff_fundador", role: "🔱 FUNDADOR", cat: "staff", mode: "auto", color: "#f1c40f" },
  { key: "staff_cofundador", role: "⚜️ CO-FUNDADOR", cat: "staff", mode: "auto", color: "#e67e22" },
  { key: "staff_desarrollador", role: "🛠️ DESARROLLADOR", cat: "staff", mode: "auto", color: "#ff4040" },
  { key: "staff_encargado", role: "⭕ ENCARGADO STAFF", cat: "staff", mode: "auto", color: "#e74c3c" },
  { key: "staff_admin", role: "🛡️ ADMINISTRADOR", cat: "staff", mode: "auto", color: "#c0392b" },
  { key: "staff_modglobal", role: "👨‍💻 MODERADOR GLOBAL", cat: "staff", mode: "auto", color: "#9b59b6" },
  { key: "staff_moderador", role: "🧑‍💻 MODERADOR", cat: "staff", mode: "auto", color: "#8e44ad" },
  { key: "staff_ayudante", role: "🙋 AYUDANTE", cat: "staff", mode: "auto", color: "#3498db" },
  { key: "staff_soporte", role: "🎫 SOPORTE", cat: "staff", mode: "auto", color: "#1abc9c" },
  { key: "cargo_contenido", role: "🎞️ DIRECTOR DE CONTENIDO", cat: "cargo", mode: "manual", color: "#c2185b" },
  { key: "cargo_eventos", role: "🎪 ORGANIZADOR DE EVENTOS", cat: "cargo", mode: "manual" },
  { key: "cargo_facciones", role: "📝 EVALUADOR DE FACCIONES", cat: "cargo", mode: "manual" },
  { key: "cargo_rpg", role: "🎮 STAFF RPG", cat: "cargo", mode: "manual" },
  { key: "cargo_cv", role: "🎙️ STAFF CV", cat: "cargo", mode: "manual" },
  { key: "cargo_scripter", role: "💻 SCRIPTER", cat: "cargo", mode: "manual" },
  { key: "cargo_mapper", role: "🗺️ MAPPER", cat: "cargo", mode: "manual" },
  { key: "sapd_12", role: "👮 COMISARIO", cat: "faccion", mode: "auto", group: "👮 POLICIA" },
  { key: "sapd_11", role: "👮 Subjefe", cat: "faccion", mode: "auto", color: "#3498db", group: "👮 POLICIA" },
  { key: "sapd_10", role: "👮 Comandante", cat: "faccion", mode: "auto", color: "#3498db", group: "👮 POLICIA" },
  { key: "sapd_9", role: "👮 Capitán (Policía)", cat: "faccion", mode: "auto", color: "#3498db", group: "👮 POLICIA" },
  { key: "sapd_8", role: "👮 Teniente (Policía)", cat: "faccion", mode: "auto", color: "#3498db", group: "👮 POLICIA" },
  { key: "sapd_7", role: "👮 Sargento (Policía)", cat: "faccion", mode: "auto", color: "#3498db", group: "👮 POLICIA" },
  { key: "sapd_6", role: "👮 Detective", cat: "faccion", mode: "auto", color: "#3498db", group: "👮 POLICIA" },
  { key: "sapd_5", role: "👮 Oficial Mayor", cat: "faccion", mode: "auto", color: "#3498db", group: "👮 POLICIA" },
  { key: "sapd_4", role: "👮 Oficial III (Policía)", cat: "faccion", mode: "auto", color: "#3498db", group: "👮 POLICIA" },
  { key: "sapd_3", role: "👮 Oficial II (Policía)", cat: "faccion", mode: "auto", color: "#3498db", group: "👮 POLICIA" },
  { key: "sapd_2", role: "👮 Oficial I (Policía)", cat: "faccion", mode: "auto", color: "#3498db", group: "👮 POLICIA" },
  { key: "sapd_1", role: "👮 Cadete (Policía)", cat: "faccion", mode: "auto", color: "#3498db", group: "👮 POLICIA" },
  { key: "lssd_9", role: "🎖 SHERIFF", cat: "faccion", mode: "auto", group: "🎖 ALGUACIL" },
  { key: "lssd_8", role: "🎖 Sub Sheriff", cat: "faccion", mode: "auto", color: "#f1c40f", group: "🎖 ALGUACIL" },
  { key: "lssd_7", role: "🎖 Capitán (Sheriff)", cat: "faccion", mode: "auto", color: "#f1c40f", group: "🎖 ALGUACIL" },
  { key: "lssd_6", role: "🎖 Teniente (Sheriff)", cat: "faccion", mode: "auto", color: "#f1c40f", group: "🎖 ALGUACIL" },
  { key: "lssd_5", role: "🎖 Sargento (Sheriff)", cat: "faccion", mode: "auto", color: "#f1c40f", group: "🎖 ALGUACIL" },
  { key: "lssd_4", role: "🎖 Oficial III (Sheriff)", cat: "faccion", mode: "auto", color: "#f1c40f", group: "🎖 ALGUACIL" },
  { key: "lssd_3", role: "🎖 Oficial II (Sheriff)", cat: "faccion", mode: "auto", color: "#f1c40f", group: "🎖 ALGUACIL" },
  { key: "lssd_2", role: "🎖 Oficial I (Sheriff)", cat: "faccion", mode: "auto", color: "#f1c40f", group: "🎖 ALGUACIL" },
  { key: "lssd_1", role: "🎖 Cadete (Sheriff)", cat: "faccion", mode: "auto", color: "#f1c40f", group: "🎖 ALGUACIL" },
  { key: "saem_12", role: "🪖 GENERAL", cat: "faccion", mode: "auto", group: "🪖 MILITAR" },
  { key: "saem_11", role: "🪖 Teniente Coronel", cat: "faccion", mode: "auto", color: "#6b8e23", group: "🪖 MILITAR" },
  { key: "saem_10", role: "🪖 Capitán (Militar)", cat: "faccion", mode: "auto", color: "#6b8e23", group: "🪖 MILITAR" },
  { key: "saem_9", role: "🪖 Teniente (Militar)", cat: "faccion", mode: "auto", color: "#6b8e23", group: "🪖 MILITAR" },
  { key: "saem_8", role: "🪖 Subteniente", cat: "faccion", mode: "auto", color: "#6b8e23", group: "🪖 MILITAR" },
  { key: "saem_7", role: "🪖 Sargento Primero", cat: "faccion", mode: "auto", color: "#6b8e23", group: "🪖 MILITAR" },
  { key: "saem_6", role: "🪖 Sargento (Militar)", cat: "faccion", mode: "auto", color: "#6b8e23", group: "🪖 MILITAR" },
  { key: "saem_5", role: "🪖 Cabo Mayor", cat: "faccion", mode: "auto", color: "#6b8e23", group: "🪖 MILITAR" },
  { key: "saem_4", role: "🪖 Cabo Primero", cat: "faccion", mode: "auto", color: "#6b8e23", group: "🪖 MILITAR" },
  { key: "saem_3", role: "🪖 Cabo", cat: "faccion", mode: "auto", color: "#6b8e23", group: "🪖 MILITAR" },
  { key: "saem_2", role: "🪖 Soldado de primera", cat: "faccion", mode: "auto", color: "#6b8e23", group: "🪖 MILITAR" },
  { key: "saem_1", role: "🪖 Soldado", cat: "faccion", mode: "auto", color: "#6b8e23", group: "🪖 MILITAR" },
  { key: "fbi_8", role: "🕵 DIRECTOR", cat: "faccion", mode: "auto", group: "🕵 FBI" },
  { key: "fbi_7", role: "🕵 Subdirector", cat: "faccion", mode: "auto", color: "#2c2f33", group: "🕵 FBI" },
  { key: "fbi_6", role: "🕵 Agente supervisor", cat: "faccion", mode: "auto", color: "#2c2f33", group: "🕵 FBI" },
  { key: "fbi_5", role: "🕵 Agente investigador", cat: "faccion", mode: "auto", color: "#2c2f33", group: "🕵 FBI" },
  { key: "fbi_4", role: "🕵 Agente mayor", cat: "faccion", mode: "auto", color: "#2c2f33", group: "🕵 FBI" },
  { key: "fbi_3", role: "🕵 Agente segundo", cat: "faccion", mode: "auto", color: "#2c2f33", group: "🕵 FBI" },
  { key: "fbi_2", role: "🕵 Agente", cat: "faccion", mode: "auto", color: "#2c2f33", group: "🕵 FBI" },
  { key: "fbi_1", role: "🕵 Agente aspirante", cat: "faccion", mode: "auto", color: "#2c2f33", group: "🕵 FBI" },
  { key: "gob_4", role: "🏛️ GOBERNADOR", cat: "faccion", mode: "auto", group: "💼 GOBIERNO" },
  { key: "gob_3", role: "💼 Jefe del Servicio Secreto", cat: "faccion", mode: "auto", color: "#607d8b", group: "💼 GOBIERNO" },
  { key: "gob_2", role: "💼 Servicio Secreto", cat: "faccion", mode: "auto", color: "#607d8b", group: "💼 GOBIERNO" },
  { key: "gob_1", role: "💼 Abogado", cat: "faccion", mode: "auto", color: "#607d8b", group: "💼 GOBIERNO" },
  { key: "citytv_3", role: "🎬 DIRECTOR DE PRENSA", cat: "faccion", mode: "auto", group: "📺 CITYTV" },
  { key: "citytv_2", role: "📺 Camarógrafo", cat: "faccion", mode: "auto", color: "#87ceeb", group: "📺 CITYTV" },
  { key: "citytv_1", role: "📺 Reportero", cat: "faccion", mode: "auto", color: "#87ceeb", group: "📺 CITYTV" },
  { key: "banda_lider", role: "🏴‍☠️ LIDER", cat: "banda", mode: "auto", group: "💀 MIEMBRO DE BANDA" },
  { key: "banda_miembro", role: "💀 MIEMBRO DE BANDA", cat: "banda", mode: "auto" },
  { key: "creador_streamer", role: "🎥 STREAMER", cat: "creador", mode: "manual" },
  { key: "creador_youtuber", role: "🔴 YOUTUBER", cat: "creador", mode: "manual" },
  { key: "creador_tiktoker", role: "🟣 TIKTOKER", cat: "creador", mode: "manual" },
  { key: "ref_leyenda", role: "👑 Leyenda del Servidor", cat: "reconocimiento", mode: "ref" },
  { key: "insignia_campeon", role: "🏆 CAMPEÓN DE EVENTOS", cat: "reconocimiento", mode: "manual" },
  { key: "insignia_destacado", role: "🌟 MIEMBRO DESTACADO", cat: "reconocimiento", mode: "manual" },
  { key: "insignia_magnate", role: "💰 Magnate de la semana", cat: "reconocimiento", mode: "manual" },
  { key: "ref_diamante", role: "💎 Embajador Diamante", cat: "reconocimiento", mode: "ref" },
  { key: "ref_oro", role: "🥇 Embajador Oro", cat: "reconocimiento", mode: "ref" },
  { key: "ref_plata", role: "🥈 Embajador Plata", cat: "reconocimiento", mode: "ref" },
  { key: "ref_bronce", role: "🥉 Embajador Bronce", cat: "reconocimiento", mode: "ref" },
  { key: "ref_reclutador", role: "📨 Reclutador", cat: "reconocimiento", mode: "ref" },
  { key: "insignia_diamante", role: "💎 USUARIO DIAMANTE", cat: "reconocimiento", mode: "manual" },
  { key: "insignia_donador", role: "💸 DONADOR", cat: "reconocimiento", mode: "manual" },
  { key: "insignia_booster", role: "🎉 CityBooster", cat: "reconocimiento", mode: "manual" },
  { key: "insignia_artista", role: "🎨 ARTISTA", cat: "reconocimiento", mode: "manual" },
  { key: "insignia_bughunter", role: "🐛 BUG HUNTER", cat: "reconocimiento", mode: "manual" },
  { key: "insignia_betatester", role: "🧪 BETA TESTER", cat: "reconocimiento", mode: "manual" },
  { key: "eco_empresario", role: "💰 EMPRESARIO", cat: "economia", mode: "auto" },
  { key: "eco_millonario", role: "💵 MILLONARIO", cat: "economia", mode: "auto" },
  { key: "logro_placa", role: "🎖️ PLACA DE HONOR", cat: "logro", mode: "auto", color: "#e2c063" },
  { key: "logro_vida", role: "🏙️ VIDA EN LA CIUDAD", cat: "logro", mode: "auto", color: "#e2c063" },
  { key: "logro_profesional", role: "🧰 PROFESIONAL", cat: "logro", mode: "auto", color: "#e2c063" },
  { key: "logro_coleccionista", role: "🚗 COLECCIONISTA", cat: "logro", mode: "auto", color: "#e2c063" },
  { key: "logro_constancia", role: "📅 CONSTANCIA", cat: "logro", mode: "auto", color: "#e2c063" },
  { key: "nivel_14", role: "🐙·USUARIO Γ CASHE", cat: "nivel", mode: "auto" },
  { key: "nivel_13", role: "⚡·USUARIO λ RELAMPAGO", cat: "nivel", mode: "auto" },
  { key: "nivel_12", role: "🌊·USUARIO Φ TSUNAMI", cat: "nivel", mode: "auto" },
  { key: "nivel_11", role: "💥·USUARIO φ FURIA", cat: "nivel", mode: "auto" },
  { key: "nivel_10", role: "🌻·USUARIO ρ ARBOL", cat: "nivel", mode: "auto" },
  { key: "nivel_9", role: "🌱·USUARIO ξ PLANTA", cat: "nivel", mode: "auto" },
  { key: "nivel_8", role: "♦️·USUARIO θ PLATA", cat: "nivel", mode: "auto" },
  { key: "nivel_7", role: "⚔️·USUARIO η HIERRO", cat: "nivel", mode: "auto" },
  { key: "nivel_6", role: "🗿·USUARIO ζ ROCA", cat: "nivel", mode: "auto" },
  { key: "nivel_5", role: "🌕·USUARIO ε PIEDRA", cat: "nivel", mode: "auto" },
  { key: "nivel_4", role: "🌀·USUARIO δ TERREMOTO", cat: "nivel", mode: "auto" },
  { key: "nivel_3", role: "🌍·USUARIO γ TIERRA", cat: "nivel", mode: "auto" },
  { key: "nivel_2", role: "🗻·USUARIO β BARRO", cat: "nivel", mode: "auto" },
  { key: "nivel_1", role: "🌴·USUARIO α ARENA", cat: "nivel", mode: "auto" },
];

// Roles fuera de la jerarquía
const VIP_ROLE = "👑 VIP"; // player.vip = 2 (mensual)
const SOCIO_ROLE = "🥇 SOCIO"; // player.vip = 3 (anual; lleva también el de VIP)
const LINKED_ROLE = "👤 USUARIO"; // cuenta vinculada (solo se agrega)

// Nombres viejos que se renombran al crear los roles (unificación de nombres)
const RENAMES = { "📺 SATV": "📺 CITYTV", "🎬 DIRECTOR SATV": "🎬 DIRECTOR DE PRENSA" };

// Títulos de nivel: nivel mínimo de nivel_1 .. nivel_14 (igual que RG_LEVEL_MIN de rangos.pwn)
const LEVEL_MIN = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 24, 27, 30];
// Escalones de invitados: personas que trajo (igual que RG_REF_MIN de rangos.pwn)
const REF_TIERS = [
  { min: 100, key: "ref_leyenda" },
  { min: 50, key: "ref_diamante" },
  { min: 25, key: "ref_oro" },
  { min: 10, key: "ref_plata" },
  { min: 5, key: "ref_bronce" },
  { min: 3, key: "ref_reclutador" },
];
// Logros con rango: ach_id en player_achievements (índice de LOGROS en logros.pwn)
const LOGRO_RANKS = { 8: "logro_vida", 11: "logro_profesional", 14: "logro_coleccionista", 19: "logro_placa", 20: "logro_constancia" };
// Facciones del juego (pfactions.id_faction) -> prefijo de clave
const FACTIONS = { 1: "sapd", 2: "fbi", 3: "saem", 4: "lssd", 5: "gob", 6: "citytv" };
// Staff del juego (player.admin_level) -> clave
const STAFF = {
  1: "staff_soporte",
  2: "staff_ayudante",
  3: "staff_moderador",
  4: "staff_modglobal",
  5: "staff_admin",
  6: "staff_encargado",
  7: "staff_desarrollador",
  8: "staff_cofundador",
  9: "staff_fundador",
};

// ---------------------------------------------------------------------------------------------------------------
// Roles que no son de la jerarquía (secciones 2, 3, 8 y 9 de la tabla). El juego manda: el bot los pone y los quita.

// Sanciones: muteo (player.mute), cárcel administrativa (player_status.ooc_jail) y advertencias (bad_history type 0 de
// los últimos WARN_DAYS días, igual que SANC_WARN_DAYS de gamemodes/src/sanciones.pwn)
const SANCTION_ROLES = { muted: "🔇 MUTEADO", oocJail: "⛓️ JAIL OOC", warnings: ["⚠️ ADVERTENCIA 1", "⚠️ ADVERTENCIA 2", "⚠️ ADVERTENCIA 3"] };
const WARN_DAYS = 30;

// Plataforma (player_status.platform, se guarda al entrar al juego). Sin dato: el bot no toca estos roles.
const PLATFORM_ROLES = { android: "📱 ANDROID", pc: "💻 PC" };

// País del personaje (pcharacter.country, CC_COUNTRIES de char_creator.pwn) -> rol. Sin país en el juego: se queda el
// que haya elegido en Discord. 🇭🇹 Haití no está en el juego: no se toca.
const COUNTRY_ROLES = {
  Colombia: "🇨🇴 Colombia",
  Argentina: "🇦🇷 Argentina",
  Mexico: "🇲🇽 México",
  Venezuela: "🇻🇪 Venezuela",
  Peru: "🇵🇪 Perú",
  Chile: "🇨🇱 Chile",
  Ecuador: "🇪🇨 Ecuador",
  Uruguay: "🇺🇾 Uruguay",
  Paraguay: "🇵🇾 Paraguay",
  Bolivia: "🇧🇴 Bolivia",
  Espana: "🇪🇸 España",
  "Estados Unidos": "🇺🇸 Estados Unidos",
  "Republica Dominicana": "🇩🇴 República Dominicana",
  Cuba: "🇨🇺 Cuba",
  "Puerto Rico": "🇵🇷 Puerto Rico",
  Guatemala: "🇬🇹 Guatemala",
  Honduras: "🇭🇳 Honduras",
  "El Salvador": "🇸🇻 El Salvador",
  Nicaragua: "🇳🇮 Nicaragua",
  "Costa Rica": "🇨🇷 Costa Rica",
  Panama: "🇵🇦 Panamá",
  Brasil: "🇧🇷 Brasil",
  Otro: "🌍 Otro país",
};

// Un rol por banda (tabla crews): "🏴 " + nombre, con el color de la banda. Se borra si la banda desaparece.
const CREW_ROLE_PREFIX = "🏴 ";

// Insignias automáticas (se guardan en player_ranks con source 'game', así también salen en el juego):
//  - 💸 DONADOR: alguna compra entregada de la tienda Tebex (tebex_commands).
//  - 💎 USUARIO DIAMANTE: coins compradas en total >= DIAMANTE_COINS (RANGOS_DIAMANTE_COINS en .env para cambiarlo).
//  - 🧪 BETA TESTER: cuenta creada durante la fase beta (RANGOS_BETA_DESDE y RANGOS_BETA_HASTA en .env, AAAA-MM-DD;
//    sin RANGOS_BETA_DESDE no se da sola).
//  - 🏆 CAMPEÓN DE EVENTOS: la da el juego con /ganadorevento (eventos.pwn).
const DIAMANTE_COINS = 100;

// Limpieza de una sola vez (la hace el bot con RANGOS_SYNC=on; con dry solo la muestra):
//  merge: se pasa a los miembros al rol nuevo y se borra el viejo (duplicados).
//  remove: se borra sin más (💎 VIP: el VIP es 👑 VIP y sale del juego).
//  noAdmin: se le quita el permiso de Administrador.
//  above: [rol, rol que tiene que quedar debajo].
const CLEANUP = {
  merge: {
    "📱 Android": "📱 ANDROID",
    "📢 Avisos: Anuncios": "🔔 Anuncios",
    "🎉 Avisos: Eventos": "🔔 Eventos",
    "🎁 Avisos: Sorteos": "🔔 Sorteos",
    "📊 Avisos: Encuestas": "🔔 Encuestas",
    "🔄 Avisos: Actualizaciones": "🔔 Actualizaciones",
  },
  remove: ["💎 VIP"],
  noAdmin: ["🥊 BETA"],
  above: [["🎖 SHERIFF", "🎖 ALGUACIL"]],
};

const BY_KEY = new Map(RANKS.map((r) => [r.key, r]));

module.exports = {
  RANKS,
  BY_KEY,
  VIP_ROLE,
  SOCIO_ROLE,
  LINKED_ROLE,
  RENAMES,
  LEVEL_MIN,
  REF_TIERS,
  LOGRO_RANKS,
  FACTIONS,
  STAFF,
  SANCTION_ROLES,
  WARN_DAYS,
  PLATFORM_ROLES,
  COUNTRY_ROLES,
  CREW_ROLE_PREFIX,
  DIAMANTE_COINS,
  CLEANUP,
};
