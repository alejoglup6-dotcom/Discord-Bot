/*
 * Copia los datos que el bot tenía en MongoDB a las tablas bot_* de MySQL.
 * Solo hace falta una vez, si el bot ya tenía datos guardados en MongoDB.
 *
 *   npm install --no-save mongoose@7
 *   MONGO_TOKEN="mongodb+srv://..." npm run migrate-mongo
 *
 * Las variables MYSQL_* se leen del .env como siempre. Si una tabla bot_* ya tiene datos, se salta
 * (así se puede volver a ejecutar sin duplicar nada); con --force se vacía y se copia de nuevo.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Chalk } = require("chalk");
const chalk = new Chalk();

let mongoose;
try {
  mongoose = require("mongoose");
} catch {
  console.log(chalk.red("Falta mongoose. Instálalo solo para la migración: npm install --no-save mongoose@7"));
  process.exit(1);
}
if (!process.env.MONGO_TOKEN) {
  console.log(chalk.red("Pon la URL de MongoDB en MONGO_TOKEN (en el .env o delante del comando)."));
  process.exit(1);
}

const odm = require("./odm");
const force = process.argv.includes("--force");
const pluralize = mongoose.pluralize();

async function main() {
  const dir = path.join(__dirname, "models");
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) require(path.join(dir, file));

  await mongoose.connect(process.env.MONGO_TOKEN);
  await odm.connect();
  const mongoDb = mongoose.connection.db;
  const existing = new Set((await mongoDb.listCollections().toArray()).map((c) => c.name));

  let total = 0;
  for (const Model of Object.values(odm.models)) {
    const collection = pluralize ? pluralize(Model.modelName) : Model.modelName;
    if (!existing.has(collection)) continue;

    const [{ n }] = await odm.db.query(`SELECT COUNT(*) AS n FROM \`${Model.table}\``);
    if (Number(n) > 0 && !force) {
      console.log(chalk.yellow(`${collection} -> ${Model.table}: ya tiene ${n} filas, se salta (usa --force para reemplazarlas)`));
      continue;
    }
    if (force) await odm.db.query(`DELETE FROM \`${Model.table}\``);

    let count = 0;
    const cursor = mongoDb.collection(collection).find({});
    for await (const raw of cursor) {
      delete raw._id;
      delete raw.__v;
      await new Model(raw).save();
      count++;
    }
    total += count;
    console.log(chalk.green(`${collection} -> ${Model.table}: ${count} documentos`));
  }

  console.log(chalk.green(`Listo: ${total} documentos copiados.`));
  await mongoose.disconnect();
  await odm.close();
}

main().catch(async (err) => {
  console.error(chalk.red("Error en la migración:"), err);
  process.exit(1);
});
