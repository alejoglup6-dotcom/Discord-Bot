const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Channel: String,
    Content: String,
    LastMessage: String,
});

module.exports = db.model("stickymessages", Schema);