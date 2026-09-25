const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const option = interaction.options.getString("option");

  let options = ["rock", "paper", "scissors"];
  const result = options[Math.floor(Math.random() * options.length)];

  switch (option) {
    case "rock":
      if (result == "paper")
        return client.embed(
          {
            title: `${client.emotes.normal.paper}・Piedra, papel o tijera`,
            desc: `Saqué ${result}, ¡gano yo!`,
            type: "editreply",
          },
          interaction,
        );

      if (result == "scissors")
        return client.embed(
          {
            title: `${client.emotes.normal.paper}・Piedra, papel o tijera`,
            desc: `Saqué ${result}, ¡ganas tú!`,
            type: "editreply",
          },
          interaction,
        );

      if (result == "rock")
        return client.embed(
          {
            title: `${client.emotes.normal.paper}・Piedra, papel o tijera`,
            desc: `Saqué ${result}, ¡es un empate!`,
            type: "editreply",
          },
          interaction,
        );
      break;

    case "paper":
      if (result == "paper")
        return client.embed(
          {
            title: `${client.emotes.normal.paper}・Piedra, papel o tijera`,
            desc: `Saqué ${result}, ¡es un empate!`,
            type: "editreply",
          },
          interaction,
        );

      if (result == "scissors")
        return client.embed(
          {
            title: `${client.emotes.normal.paper}・Piedra, papel o tijera`,
            desc: `Saqué ${result}, ¡gano yo!`,
            type: "editreply",
          },
          interaction,
        );

      if (result == "rock")
        return client.embed(
          {
            title: `${client.emotes.normal.paper}・Piedra, papel o tijera`,
            desc: `Saqué ${result}, ¡ganas tú!`,
            type: "editreply",
          },
          interaction,
        );
      break;

    case "scissors":
      if (result == "paper")
        return client.embed(
          {
            title: `${client.emotes.normal.paper}・Piedra, papel o tijera`,
            desc: `Saqué ${result}, ¡ganas tú!`,
            type: "editreply",
          },
          interaction,
        );

      if (result == "scissors")
        return client.embed(
          {
            title: `${client.emotes.normal.paper}・Piedra, papel o tijera`,
            desc: `Saqué ${result}, ¡es un empate!`,
            type: "editreply",
          },
          interaction,
        );

      if (result == "rock")
        return client.embed(
          {
            title: `${client.emotes.normal.paper}・Piedra, papel o tijera`,
            desc: `Saqué ${result}, ¡gano yo!`,
            type: "editreply",
          },
          interaction,
        );
      break;
  }
};
