const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    User: String,
    Birthday: String,
});

module.exports = db.model("birthday", Schema);