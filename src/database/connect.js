const { Chalk } = require("chalk");
const chalk = new Chalk();
const odm = require("./odm");
const samp = require("./samp");

async function connect() {
  console.log(
    chalk.blue(chalk.bold(`Database`)),
    chalk.white(`>>`),
    chalk.red(`MySQL`),
    chalk.green(`is connecting...`),
  );
  try {
    await odm.connect();
  } catch (err) {
    console.log(
      chalk.red(`[ERROR]`),
      chalk.white(`>>`),
      chalk.red(`MySQL`),
      chalk.white(`>>`),
      chalk.red(`Failed to connect to MySQL!`),
      chalk.white(`>>`),
      chalk.red(`Error: ${err}`),
    );
    console.log(chalk.red("Exiting..."));
    process.exit(1);
  }

  console.log(
    chalk.blue(chalk.bold(`Database`)),
    chalk.white(`>>`),
    chalk.red(`MySQL`),
    chalk.green(`is ready!`),
  );

  // Tablas del servidor de SA-MP: solo si la base de datos es la del gamemode
  const hasSamp = await samp.init().catch((err) => {
    console.log(chalk.red(`[ERROR]`), chalk.white(`>>`), chalk.red(`SA-MP`), chalk.white(`>>`), chalk.red(`${err}`));
    return false;
  });
  console.log(
    chalk.blue(chalk.bold(`Database`)),
    chalk.white(`>>`),
    chalk.red(`SA-MP`),
    hasSamp ? chalk.green(`tablas del servidor encontradas, /samp activo`) : chalk.yellow(`no hay tabla player, /samp desactivado`),
  );
  return;
}

module.exports = connect;
