const db = require('../odm');

const Schema = new db.Schema({
    User: String,
});

module.exports = db.model("userBans", Schema);