const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Name: String,
    Responce: String,
});

module.exports = db.model("customCommands", Schema);