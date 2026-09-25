const { Chalk } = require('chalk');
const chalk = new Chalk();

module.exports = (client, name) => {
    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Lavalink`), chalk.white(name), chalk.green(`connected!`))
};
