const db = require('../odm');

const Schema = new db.Schema({
    Action: String,
    Date: String
});

module.exports = db.model("developers", Schema);