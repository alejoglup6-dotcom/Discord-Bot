const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    User: String,
    Code: String,
    Note: String
});

module.exports = db.model("notes", Schema);