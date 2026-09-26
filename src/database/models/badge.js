const db = require('../odm');

const Schema = new db.Schema({
    User: { type: String },
    FLAGS: { type: Array }
});

module.exports = db.model("badges", Schema);