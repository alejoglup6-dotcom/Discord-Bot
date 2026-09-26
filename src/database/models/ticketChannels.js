const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    TicketID: Number,
    channelID: String,
    creator: String,
    claimed: String,
    resolved: { type: Boolean, default: false }
});

module.exports = db.model("ticketChannels", Schema);