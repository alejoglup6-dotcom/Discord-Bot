const db = require('../odm');

// Fortuna (minijuego): propiedades y armas compradas
const Schema = new db.Schema({
    Guild: String,
    User: String,
    Category: String,
    Item: String,
    Price: Number,
    BoughtAt: Number,
    LastCollect: Number
});

module.exports = db.model("fortunaAssets", Schema);
