const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    User: String,
    Parent: { type: Array, default: null },
    Partner: { type: String, default: null },
    Children: { type: Array, default: null },
});

module.exports = db.model("family", Schema);