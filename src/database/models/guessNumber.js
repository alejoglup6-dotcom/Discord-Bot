const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Channel: String,
    Number: { type: String, default: "5126" },
});

module.exports = db.model("guessNumber", Schema);