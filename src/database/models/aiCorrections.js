const db = require('../odm');

// Correcciones del staff (tabla bot_aicorrections): pregunta + respuesta correcta.
// Entran a la IA con prioridad máxima, por encima de la guía (ver iaCorrecciones.js).
const Schema = new db.Schema({
    Guild: String,
    Num: Number,         // número corto para borrarla con /ia borrar
    Question: String,
    Answer: String,
    By: String,          // ID de quien la creó
    ByName: String,
    At: Number,
});

module.exports = db.model("aiCorrections", Schema);
