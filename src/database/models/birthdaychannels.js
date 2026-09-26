const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Channel: String,
});

module.exports = db.model("birthdaychannels", Schema);