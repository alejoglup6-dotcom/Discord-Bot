const db = require('../odm');

// Recompensas por invitación ya entregadas (para no pagar dos veces)
// Kind: "invitee" (Key = id del invitado) o "tier" (Key = cantidad de invitaciones del nivel)
const Schema = new db.Schema({
    Guild: String,
    User: String,
    Kind: String,
    Key: String,
    At: Number
});

module.exports = db.model("inviteRewardLog", Schema);
