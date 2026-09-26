const db = require('../odm');

// Canales y roles que monta /montar (para enlazarlos en la bienvenida y en los mensajes de info)
const Schema = new db.Schema({
    Guild: String,
    Rules: String,
    Announcements: String,
    InviteInfo: String,
    FortunaInfo: String,
    FortunaChannel: String,
    Chat: String,
    MagnateRole: String,
    LastPrizeWeek: String
});

module.exports = db.model("serverLayout", Schema);
