const db = require('../odm');

// Creadores de TikTok que vigila cada servidor (se manejan con /tiktok add | remove | list; src/handlers/functions/tiktok.js).
// User = usuario de TikTok; Member = su cuenta de Discord (opcional, sale en los avisos sin notificarle).
const Schema = new db.Schema({
    Guild: String,
    User: String,
    Member: String,
    AddedBy: String,
    Date: Number
});

module.exports = db.model("tiktokCreators", Schema);
