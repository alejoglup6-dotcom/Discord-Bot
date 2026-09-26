const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Role: String,
});

module.exports = db.model("joinRole", Schema);