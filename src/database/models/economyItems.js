const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    User: String,
    FishingRod: { type: Boolean, default: false },
    FishingRodUsage: { type: Number, default: 0 },
});

module.exports = db.model("economyItems", Schema);