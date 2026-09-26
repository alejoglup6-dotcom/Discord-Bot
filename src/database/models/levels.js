const db = require('../odm');

const Schema = new db.Schema({
    userID: { type: String },
    guildID: { type: String },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: new Date() }
});

module.exports = db.model("Levels", Schema);