const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    User: String,
    Message: {type: String, default: false}
});

module.exports = db.model("afk", Schema);