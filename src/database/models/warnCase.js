const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Case: Number
});

module.exports = db.model("warnCase", Schema);