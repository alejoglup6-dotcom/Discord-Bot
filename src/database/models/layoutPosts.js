const db = require('../odm');

// Mensajes que publicó /reorganizar aplicar en cada canal del plano (para cambiarlos la próxima vez)
const Schema = new db.Schema({
    Guild: String,
    Slot: String,
    Channel: String,
    Messages: String, // JSON con los IDs
});

module.exports = db.model("layoutPosts", Schema);
