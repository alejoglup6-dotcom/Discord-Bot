const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    openTicket: String,
    dmMessage: String
});

module.exports = db.model("ticketMessage", Schema);