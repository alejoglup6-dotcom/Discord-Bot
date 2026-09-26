const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    User: String,
    Messages: Number,
});

module.exports = db.model("messages", Schema);