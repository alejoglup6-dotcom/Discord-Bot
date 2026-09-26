const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Invites: Number,
    Role: String,
});

module.exports = db.model("inviteRewards", Schema);