const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Channel: String,
    Word: { type: String, default: "start" },
});

module.exports = db.model("guessWord", Schema);