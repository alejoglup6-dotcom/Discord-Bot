const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    inviteUser: String,
    User: String,
});

module.exports = db.model("inviteBy", Schema);