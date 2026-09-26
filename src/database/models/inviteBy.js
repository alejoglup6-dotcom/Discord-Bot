const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    inviteUser: String,
    User: String,
    // Cuenta de Discord con la antigüedad mínima al entrar (las multicuentas nuevas no cuentan para premios)
    Valid: { type: Boolean, default: false },
    // Sigue en el servidor
    Active: { type: Boolean, default: true },
});

module.exports = db.model("inviteBy", Schema);