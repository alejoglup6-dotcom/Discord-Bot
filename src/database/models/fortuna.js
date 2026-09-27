const db = require('../odm');

// Fortuna (minijuego): oficio y esperas de cada miembro
const Schema = new db.Schema({
    Guild: String,
    User: String,
    Job: { type: String, default: null },
    JobSince: Number,
    LastWork: { type: Number, default: 0 },
    LastHeist: { type: Number, default: 0 },
    Shifts: { type: Number, default: 0 },
    Earned: { type: Number, default: 0 }
});

module.exports = db.model("fortuna", Schema);
