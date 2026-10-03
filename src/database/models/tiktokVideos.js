const db = require('../odm');

// Videos de TikTok ya avisados en cada servidor (src/handlers/functions/tiktok.js)
const Schema = new db.Schema({
    Guild: String,
    Video: String,
    Date: Number
});

module.exports = db.model("tiktokVideos", Schema);
