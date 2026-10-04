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
});

module.exports = db.model("ticketInfo", Schema);
