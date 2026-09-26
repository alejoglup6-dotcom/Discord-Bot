const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Channel: String,
    lastWord: String,
});

module.exports = db.model("wordsnake", Schema);