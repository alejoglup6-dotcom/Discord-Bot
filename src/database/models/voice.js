const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Category: String,
    Channel: String,
    ChannelName: String,
    ChannelCount: { type: Number, default: 0 }
});

module.exports = db.model("voice", Schema);