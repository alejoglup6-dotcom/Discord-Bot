const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Channels: Array
});

module.exports = db.model("channellist", Schema);