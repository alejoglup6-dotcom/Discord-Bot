const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Message: String
});

module.exports = db.model("levelmessage", Schema);