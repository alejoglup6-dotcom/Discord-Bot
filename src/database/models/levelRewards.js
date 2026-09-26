const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Level: Number,
    Role: String,
});

module.exports = db.model("levelRewards", Schema);