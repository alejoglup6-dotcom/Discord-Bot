/*
 * Tipos de ticket (src/assets/utils/ticketsPro.js). Cada uno tiene su formulario (máximo 5 preguntas, límite de
 * Discord) y, si hace falta, un nivel mínimo de staff: además del rol de soporte, se avisa y se da acceso a los roles
 * de staff de ese nivel para arriba (STAFF de src/assets/data/rangos.js; 3 = Moderador, 4 = Moderador Global,
 * 5 = Administrador).
 * style: "short" (una línea) o "long" (párrafo).
 */
const TYPES = [
  {
    key: "ayuda",
    label: "Ayuda general",
    emoji: "🛠️",
    desc: "Dudas del juego, de tu cuenta o del Discord",
    fields: [{ id: "tema", label: "¿En qué te ayudamos?", style: "long", max: 1000 }],
  },
  {
    key: "acceso",
    label: "No puedo verificarme",
    emoji: "🔐",
    desc: "Problemas para iniciar sesión en la web o vincular Discord",
    fields: [
      { id: "cuenta", label: "Tu nombre en el juego (Nombre_Apellido)", style: "short", max: 24, required: false },
      { id: "problema", label: "¿Qué te sale o qué no funciona?", style: "long", max: 800 },
    ],
  },
  {
    key: "reporte",
    label: "Reportar a un jugador",
    emoji: "🚨",
    desc: "Alguien rompió las normas dentro o fuera del juego",
    minStaff: 3,
    fields: [
      { id: "acusado", label: "Nombre del jugador (Nombre_Apellido)", style: "short", max: 40 },
      { id: "hechos", label: "¿Qué pasó? Fecha, hora y lugar", style: "long", max: 1000 },
      { id: "pruebas", label: "Pruebas: enlaces a video o capturas", style: "long", max: 500, required: false },
    ],
  },
  {
    key: "bug",
    label: "Reportar un fallo",
    emoji: "🐞",
    desc: "Algo del servidor o del bot no funciona bien",
    fields: [
      { id: "donde", label: "¿Dónde pasa? (comando, lugar o sistema)", style: "short", max: 100 },
      { id: "como", label: "¿Qué hiciste y qué pasó?", style: "long", max: 1000 },
    ],
  },
  {
    key: "apelacion",
    label: "Apelar una sanción",
    emoji: "⚖️",
    desc: "Ban, jail, muteo o advertencia que crees injusta",
    minStaff: 4,
    fields: [
      { id: "sancion", label: "¿Qué sanción y cuándo?", style: "short", max: 100 },
      { id: "staff", label: "¿Quién te sancionó? (si lo sabes)", style: "short", max: 40, required: false },
      { id: "motivo", label: "¿Por qué debería revisarse?", style: "long", max: 1000 },
    ],
  },
  {
    key: "tienda",
    label: "Tienda, VIP o CityCoins",
    emoji: "💎",
    desc: "Compras que no llegaron, pagos y membresías",
    minStaff: 5,
    fields: [
      { id: "compra", label: "Comprobante o ID de la compra", style: "short", max: 60, required: false },
      { id: "problema", label: "¿Qué compraste y qué pasó?", style: "long", max: 800 },
    ],
  },
  {
    key: "facciones",
    label: "Facciones y bandas",
    emoji: "👮",
    desc: "Ingresos, rangos y problemas de una facción o banda",
    fields: [
      { id: "grupo", label: "Facción o banda", style: "short", max: 60 },
      { id: "detalle", label: "Cuéntanos", style: "long", max: 1000 },
    ],
  },
  {
    key: "alianza",
    label: "Alianzas y creadores",
    emoji: "🤝",
    desc: "Proponer una alianza o pedir el rol de creador",
    fields: [
      { id: "enlace", label: "Enlace (servidor, canal o perfil)", style: "short", max: 200 },
      { id: "propuesta", label: "¿Qué propones?", style: "long", max: 1000 },
    ],
  },
];

const BY_KEY = new Map(TYPES.map((t) => [t.key, t]));

// Horas de inactividad (último mensaje) para avisar y para cerrar solo; horas que un ticket cerrado tarda en borrarse.
// 0 = desactivado. Se cambian con TICKETS_AVISO_H, TICKETS_CIERRE_H y TICKETS_BORRAR_H en el .env.
const TIMES = { remindH: 48, closeH: 72, deleteH: 24 };

const PRIORITIES = [
  { key: "normal", label: "Normal", emoji: "🟢" },
  { key: "alta", label: "Alta", emoji: "🟠" },
  { key: "urgente", label: "Urgente", emoji: "🔴" },
];

module.exports = { TYPES, BY_KEY, TIMES, PRIORITIES };
