const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Channel: String,
    Mode: { type: String, default: "hard" },
});

module.exports = db.model("countChannel", Schema);