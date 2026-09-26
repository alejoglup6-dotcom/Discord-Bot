const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Role: String,
    Amount: Number
});

module.exports = db.model("economyStore", Schema);