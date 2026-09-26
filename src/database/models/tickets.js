const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Category: String,
    Role: String,
    Channel: String,
    Logs: String,
    TicketCount: { type: Number, default: 0 },
});

module.exports = db.model("tickets", Schema);