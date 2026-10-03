const db = require('../odm');

// Creadores de contenido con su TikTok registrado con /tiktok (src/handlers/functions/tiktok.js avisa de sus videos
// que mencionan a la cuenta oficial)
const Schema = new db.Schema({
    Guild: String,
    User: String,
    TikTok: String,
    Date: Number
});

module.exports = db.model("tiktokCreators", Schema);
