const db = require('../odm');

// Historial de conversación de la IA: una fila por mensaje (tabla bot_aimemory).
// Guild, User, Channel y messageId son campos indexados por el ODM (INDEXED_KEYS).
const Schema = new db.Schema({
    Guild: String,
    User: String,        // ID del usuario con el que se conversa (la memoria es por usuario)
    Channel: String,     // canal donde se escribió
    messageId: String,   // ID del mensaje de Discord (sirve para saber si un mensaje es una respuesta de la IA)
    Role: String,        // "user" | "assistant"
    Name: String,        // nombre visible de quien habla
    Tag: String,         // etiqueta (usuario) de quien habla
    Content: String,     // texto del mensaje
    Provider: String,    // proveedor/modelo que respondió (solo en "assistant")
    At: Number,          // fecha en milisegundos
});

module.exports = db.model("aiMemory", Schema);
