const db = require('../odm');

const Schema = new db.Schema({
    User: String,
    Credits: Number,
    Unlimited: Boolean
});

module.exports = db.model("votecredits", Schema);