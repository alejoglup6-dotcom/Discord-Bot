const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    boostMessage: String,
    unboostMessage: String,
});

module.exports = db.model("boostMessage", Schema);