const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Name: String,
    Responce: String,
    Action: { type: String, default: "Normal" },
});

module.exports = db.model("customCommandsAdvanced", Schema);