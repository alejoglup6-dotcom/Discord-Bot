const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    User: String,
    Beg: String,
    Crime: String,
    Daily: String,
    Weekly: String,
    Monthly: String,
    Hourly: String,
    Work: String,
    Rob: String,
    Fish: String,
    Hunt: String,
    Yearly: String,
    Present: String
});

module.exports = db.model("economytimeout", Schema);