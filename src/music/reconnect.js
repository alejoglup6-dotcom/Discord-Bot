const { Chalk } = require("chalk");
const chalk = new Chalk();

// Cuando un nodo agota sus reintentos, Shoukaku lo quita de la lista y no vuelve
// a intentarlo. Aquí se vuelve a añadir más tarde, esperando cada vez más
// (1, 2, 4... hasta 10 minutos) para no alargar un bloqueo 429 del nodo.
module.exports = (client, nodes) => {
  const shoukaku = client.player.shoukaku;
  const attempts = new Map();
  const pending = new Set();

  shoukaku.on("ready", (name) => attempts.delete(name));

  shoukaku.on("error", (name) => {
    // El nodo se elimina justo antes de emitir el error; se comprueba un poco después
    setTimeout(() => {
      const options = nodes.find((node) => node.name === name);
      if (!options || shoukaku.nodes.has(name) || pending.has(name)) return;

      const attempt = (attempts.get(name) ?? 0) + 1;
      attempts.set(name, attempt);
      const delay = Math.min(60 * 2 ** (attempt - 1), 600);

      console.log(
        chalk.blue(chalk.bold(`System`)),
        chalk.white(`>>`),
        chalk.red(`Lavalink`),
        chalk.white(name),
        chalk.yellow(`se volverá a conectar en ${delay} s`),
      );

      pending.add(name);
      setTimeout(() => {
        pending.delete(name);
        if (!shoukaku.nodes.has(name)) shoukaku.addNode(options);
      }, delay * 1000);
    }, 1000);
  });
};
