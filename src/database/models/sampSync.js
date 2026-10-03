const db = require('../odm');

// Lo que el bot ya reflejó entre el juego y Discord (src/handlers/functions/sampSync.js)
// Kind: "base" (último baneo del juego al empezar: los anteriores no se tocan), "vip", "mute", "ban"
const Schema = new db.Schema({
    Guild: String,
    Player: Number,
    Kind: String,
    Ref: Number,
    Mode: String,
    Date: Number
});

module.exports = db.model("sampSync", Schema);
