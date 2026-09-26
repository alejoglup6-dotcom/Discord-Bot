const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Words: Array
});

module.exports = db.model("blacklist-words", Schema);