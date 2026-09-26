const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    User: String,
    Count: Number,
});

module.exports = db.model("count", Schema);