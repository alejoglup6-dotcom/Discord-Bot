const db = require('../odm');

const Schema = new db.Schema({
    User: String,
    Text: String,
    endTime: Number
});

module.exports = db.model("reminder", Schema);