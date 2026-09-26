const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    inviteJoin: String,
    inviteLeave: String
});

module.exports = db.model("inviteMessages", Schema);