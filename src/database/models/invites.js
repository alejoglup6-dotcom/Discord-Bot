const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    User: String,
    Invites: Number,
    Total: Number,
    Left: Number
});

module.exports = db.model("invites", Schema);