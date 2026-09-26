/*
 * Catálogo de la Fortuna: minijuego de economía de Discord con temática del servidor de SA-MP.
 * Usa el mismo dinero que /economy (efectivo y banco) y NO toca nada del juego.
 * Para cambiar precios, sueldos o esperas basta con editar este archivo.
 */

// Oficios. pay: sueldo por turno [mínimo, máximo] · cooldown: minutos entre turnos · needs: lo que hay que tener
const JOBS = [
  { id: "basurero", name: "Basurero", emoji: "🗑️", pay: [150, 350], cooldown: 5, text: "recoges la basura de Ganton" },
  { id: "granjero", name: "Granjero", emoji: "🚜", pay: [250, 500], cooldown: 8, text: "cosechas los campos de Blueberry" },
  { id: "pescador", name: "Pescador", emoji: "🎣", pay: [300, 600], cooldown: 10, text: "pescas en el muelle de Santa María" },
  { id: "lenador", name: "Leñador", emoji: "🪓", pay: [350, 700], cooldown: 10, text: "talas árboles en Angel Pine" },
  { id: "repartidor", name: "Repartidor", emoji: "📦", pay: [450, 850], cooldown: 12, needs: { autos: 1 }, text: "repartes paquetes por Los Santos" },
  { id: "taxista", name: "Taxista", emoji: "🚕", pay: [600, 1100], cooldown: 15, needs: { autos: 1 }, text: "llevas pasajeros por toda la ciudad" },
  { id: "mecanico", name: "Mecánico", emoji: "🔧", pay: [700, 1300], cooldown: 15, text: "reparas vehículos en el taller" },
  { id: "camionero", name: "Camionero", emoji: "🚛", pay: [900, 1600], cooldown: 20, needs: { autos: 1 }, text: "llevas mercancía de Los Santos a Las Venturas" },
  { id: "medico", name: "Médico", emoji: "🩺", pay: [1000, 1800], cooldown: 20, text: "atiendes pacientes en el hospital All Saints" },
  { id: "policia", name: "Policía", emoji: "🚓", pay: [1100, 2000], cooldown: 20, needs: { armas: 1 }, text: "patrullas las calles de Los Santos" },
];

// Propiedades y armas. price: precio · income: ganancia por hora (se cobra con /fortuna cobrar)
// bonus (armas): puntos extra de éxito al asaltar
const CATEGORIES = {
  autos: {
    name: "Autos",
    emoji: "🚗",
    items: [
      { id: "faggio", name: "Faggio", price: 4000 },
      { id: "perenniel", name: "Perenniel", price: 9000 },
      { id: "sentinel", name: "Sentinel", price: 18000 },
      { id: "sanchez", name: "Sanchez", price: 22000 },
      { id: "elegy", name: "Elegy", price: 38000 },
      { id: "sultan", name: "Sultan", price: 55000 },
      { id: "nrg500", name: "NRG-500", price: 70000 },
      { id: "infernus", name: "Infernus", price: 150000 },
    ],
  },
  casas: {
    name: "Casas",
    emoji: "🏡",
    items: [
      { id: "caravana", name: "Caravana en Fort Carson", price: 25000, income: 60 },
      { id: "ganton", name: "Casa en Ganton", price: 60000, income: 150 },
      { id: "jefferson", name: "Casa en Jefferson", price: 90000, income: 220 },
      { id: "rodeo", name: "Apartamento en Rodeo", price: 160000, income: 400 },
      { id: "mulholland", name: "Casa en Mulholland", price: 320000, income: 800 },
      { id: "vinewood", name: "Mansión en Vinewood", price: 650000, income: 1600 },
    ],
  },
  negocios: {
    name: "Negocios",
    emoji: "🏪",
    items: [
      { id: "hotdogs", name: "Puesto de hot dogs", price: 40000, income: 250 },
      { id: "tienda247", name: "Tienda 24/7", price: 110000, income: 700 },
      { id: "bar", name: "Bar Ten Green Bottles", price: 180000, income: 1150 },
      { id: "gasolinera", name: "Gasolinera de Idlewood", price: 260000, income: 1650 },
      { id: "taller", name: "Taller Transfender", price: 350000, income: 2200 },
    ],
  },
  empresas: {
    name: "Empresas",
    emoji: "🏢",
    items: [
      { id: "taxis", name: "Compañía de taxis", price: 700000, income: 4200 },
      { id: "transportes", name: "Transportes RS Haul", price: 1200000, income: 7200 },
      { id: "club", name: "Club nocturno Alhambra", price: 2000000, income: 12000 },
      { id: "casino", name: "Casino Four Dragons", price: 4500000, income: 27000 },
    ],
  },
  armas: {
    name: "Armas",
    emoji: "🔫",
    items: [
      { id: "bate", name: "Bate de béisbol", price: 1500, bonus: 5 },
      { id: "9mm", name: "Pistola 9mm", price: 6000, bonus: 10 },
      { id: "deagle", name: "Desert Eagle", price: 14000, bonus: 15 },
      { id: "escopeta", name: "Escopeta", price: 25000, bonus: 20 },
      { id: "mp5", name: "MP5", price: 40000, bonus: 25 },
      { id: "ak47", name: "AK-47", price: 65000, bonus: 30 },
    ],
  },
};

const SELL_RATE = 0.7; // al vender se recupera el 70% del precio
const MAX_INCOME_HOURS = 24; // las ganancias se acumulan como máximo 24 horas sin cobrar

// Asaltos (/fortuna asaltar): éxito = base + bonus de la mejor arma. Fallar cuesta una multa.
const HEISTS = [
  { id: "tienda", name: "la Tienda 24/7 de Idlewood", reward: [800, 2500], base: 55 },
  { id: "gasolinera", name: "la gasolinera de Dillimore", reward: [1500, 4500], base: 45 },
  { id: "joyeria", name: "la joyería de Rodeo", reward: [4000, 10000], base: 35 },
  { id: "banco", name: "el banco de Palomino Creek", reward: [10000, 25000], base: 20 },
];
const HEIST_COOLDOWN = 30; // minutos
const HEIST_FINE = [500, 2000];

// Premios semanales: cada domingo a las 20:00 (FORTUNA_TZ del .env, por defecto hora de México) las 3 mayores
// fortunas del servidor cobran el premio y la primera se lleva el rol "Magnate de la semana".
// Solo en servidores con un canal "fortuna" (ahí se anuncia) y el rol "💰 Magnate de la semana".
const WEEKLY_PRIZES = [250000, 150000, 75000];
const PRIZE_DAY = 0; // 0 = domingo
const PRIZE_HOUR = 20;
const MAGNATE_ROLE = "💰 Magnate de la semana";

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Busca por id o por nombre (sin tildes ni mayúsculas; vale el principio del nombre)
function findIn(list, query) {
  const q = normalize(query);
  if (!q) return null;
  return (
    list.find((x) => x.id === q || normalize(x.name) === q) ||
    list.find((x) => normalize(x.name).startsWith(q) || normalize(x.id).startsWith(q)) ||
    list.find((x) => normalize(x.name).includes(q)) ||
    null
  );
}

function findJob(query) {
  return findIn(JOBS, query);
}

function findCategory(query) {
  const q = normalize(query);
  if (!q) return null;
  const aliases = { auto: "autos", coche: "autos", coches: "autos", vehiculos: "autos", casa: "casas", negocio: "negocios", empresa: "empresas", arma: "armas" };
  const id = CATEGORIES[q] ? q : aliases[q] || Object.keys(CATEGORIES).find((k) => k.startsWith(q));
  return id ? { id, ...CATEGORIES[id] } : null;
}

function findItem(categoryId, query) {
  const cat = CATEGORIES[categoryId];
  return cat ? findIn(cat.items, query) : null;
}

function getItem(categoryId, itemId) {
  return CATEGORIES[categoryId]?.items.find((i) => i.id === itemId) || null;
}

function money(n) {
  return "$" + Math.round(Number(n) || 0).toLocaleString("es-ES");
}

module.exports = {
  JOBS,
  CATEGORIES,
  SELL_RATE,
  MAX_INCOME_HOURS,
  HEISTS,
  HEIST_COOLDOWN,
  HEIST_FINE,
  WEEKLY_PRIZES,
  PRIZE_DAY,
  PRIZE_HOUR,
  MAGNATE_ROLE,
  findJob,
  findCategory,
  findItem,
  getItem,
  money,
  normalize,
};
