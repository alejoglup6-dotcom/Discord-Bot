/*
 * Pasa el dinero del banco a efectivo (Money) de todos los miembros.
 * Hace falta una sola vez: la economía anterior (/economy deposit y withdraw) se eliminó y Fortuna solo
 * gasta efectivo, así que lo que quedó en el banco no se puede usar. El ranking sí lo cuenta.
 *
 *   node src/database/migrar-banco.js           -> solo muestra cuánto se movería
 *   node src/database/migrar-banco.js --aplicar -> lo mueve
 *
 * Es seguro repetirlo: cada miembro se mueve de forma atómica y solo si aún tiene ese saldo en el banco.
 */
require("dotenv").config();
const odm = require("./odm");
const Economy = require("./models/economy");

(async () => {
  const apply = process.argv.includes("--aplicar");
  await odm.connect();
  const rows = await Economy.find({ Bank: { $gt: 0 } }).lean();
  const total = rows.reduce((sum, r) => sum + (Number(r.Bank) || 0), 0);
  console.log(`${rows.length} miembros con dinero en el banco, ${total} en total.`);
  if (!apply) {
    console.log("No se cambió nada. Para moverlo ejecuta el script con --aplicar.");
    return process.exit(0);
  }
  let moved = 0;
  for (const r of rows) {
    const bank = Number(r.Bank) || 0;
    if (bank <= 0) continue;
    const res = await Economy.updateOne(
      { Guild: r.Guild, User: r.User, Bank: { $gte: bank } },
      { $inc: { Money: bank, Bank: -bank } },
    );
    if (res.modifiedCount) moved += bank;
  }
  console.log(`Listo: se movieron ${moved} del banco al efectivo.`);
  process.exit(0);
})().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
