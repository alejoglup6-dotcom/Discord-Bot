const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    User: String,
    Money: Number,
    Bank: Number
});

module.exports = db.model("economy", Schema);