const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Message: String,
    Category: String,
    Roles: Object
});

module.exports = db.model("reactionRoles", Schema);