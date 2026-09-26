const db = require('../odm');

const Schema = new db.Schema({
    guildId: String,
    userId: String,
    expires: Date
});

module.exports = db.model("tempban", Schema);