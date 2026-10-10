const db = require('../odm');

// Huecos de conocimiento de la IA (tabla bot_aigaps): preguntas que la IA no supo responder con la guía,
// o respuestas que alguien marcó con 👎. Es la lista de lo que falta documentar.
const Schema = new db.Schema({
    Guild: String,
    Key: String,         // pregunta normalizada (sirve para agrupar repetidas)
    Question: String,    // pregunta tal como la escribieron (última vez)
    Answer: String,      // respuesta de la IA (solo en "mala-respuesta")
    Sources: String,     // secciones de la guía usadas (solo en "mala-respuesta")
    Kind: String,        // "sin-info" | "mala-respuesta"
    Count: Number,       // cuántas veces se repitió
    First: Number,       // primera vez (ms)
    At: Number,          // última vez (ms)
});

module.exports = db.model("aiGaps", Schema);
