const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Levels: { type: Boolean, default: false },
    Beta: { type: Boolean, default: false },
    AntiAlt: { type: Boolean, default: false },
    AntiSpam: { type: Boolean, default: false },
    AntiCaps: { type: Boolean, default: false },
    AntiInvite: { type: Boolean, default: false },
    AntiLinks: { type: Boolean, default: false },
    Prefix: String,
    Color: String 
});

module.exports = db.model("functions", Schema);