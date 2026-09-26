const db = require('../odm');

const Schema = new db.Schema({
    User: String,
    Author: String
});

module.exports = db.model("thanksAuthor", Schema);