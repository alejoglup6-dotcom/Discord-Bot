const db = require('../odm');

// Datos de cada ticket del sistema nuevo (src/assets/utils/ticketsPro.js): tipo, formulario, prioridad, quién lo
// atiende, cierre y valoración. La fila base sigue en ticketChannels (la usan /tickets y los botones viejos).
const Schema = new db.Schema({
    Guild: String,
    channelID: String,
    TicketID: Number,
    creator: String,
    type: String,
    answers: String,       // JSON [{ label, value }]
    player: String,        // cuenta del juego vinculada al abrir
    priority: { type: String, default: "normal" },
    claimedBy: String,
    openedAt: Date,
    claimedAt: Date,
    reminded: { type: Boolean, default: false },
    closedAt: Date,
    closedBy: String,
    reason: String,
    rating: Number,
    // IA en tickets (src/assets/utils/iaTickets.js)
    aiState: String,       // "" = la IA puede contestar | "staff" = pidieron al staff o hubo un humano (la IA se calla) | "done" = resuelto con la IA
    aiReplies: { type: Number, default: 0 },
    aiHandled: { type: Boolean, default: false }, // la IA llegó a contestar al usuario
    aiSummary: String,     // resumen de 2 líneas al cerrar
    aiCategory: String,    // categoría corta al cerrar
});

module.exports = db.model("ticketInfo", Schema);
