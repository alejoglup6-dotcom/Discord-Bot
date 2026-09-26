const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Messages: Number,
    Role: String,
});

module.exports = db.model("messageRewards", Schema);