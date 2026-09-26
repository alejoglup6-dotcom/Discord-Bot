const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Channel: String,
    Role: String,
    Logs: String,
});

module.exports = db.model("verify", Schema);