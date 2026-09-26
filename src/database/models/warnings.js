const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    User: String,
    Warnings: [Object]
});

module.exports = db.model("warnings", Schema);