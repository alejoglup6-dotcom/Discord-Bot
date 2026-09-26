const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Name: String,
    Url: String
});

module.exports = db.model("radios", Schema);