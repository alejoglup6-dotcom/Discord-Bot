const db = require('../odm');

const Schema = new db.Schema({
    User: String,
    UserTag: String,
    Received: Number
});

module.exports = db.model("thanks", Schema);