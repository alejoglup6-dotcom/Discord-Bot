// Conecta los sistemas del bot con los canales del servidor de SampCity.
// Se ejecuta al arrancar solo si en el .env está SERVER_SETUP=true.
// Se puede repetir sin problemas: actualiza la configuración sin duplicarla.
const { Chalk } = require("chalk");
const chalk = new Chalk();

const setup = {
  guild: "1547828378961317938",
  channels: {
    welcomeChannels: "1552764621675298826", // 🎍┆bienvenidas
    leaveChannels: "1552764622660968698", // 👋┆despedidas
    birthdaychannels: "1552764724028903445", // 🎂┆cumpleaños
    suggestionChannels: "1552764726914711733", // 🗳️┆sugerencias
    starboardChannels: "1553182865053716510", // ⭐┆destacados
    reviewChannels: "1553182866299559987", // 📝┆reseñas
    countChannel: "1553182858141769879", // 🔢┆contar
    guessNumber: "1553182859462975579", // 🔢┆adivina-el-numero
    guessWord: "1553182861308465254", // 💬┆adivina-la-palabra
    wordsnake: "1553182863506149437", // 🐍┆serpiente-de-palabras
    logChannels: "1552764882816864347", // 📜┆server-logs
    levelChannels: "1552764757537198121", // 🆙┆niveles
    boostChannels: "1552764728454025337", // 🚀┆nuevos-boosters
  },
  tickets: {
    Category: "1552764784213233806", // 🎫 TICKETS
    Role: "1552764468482809978", // 🎫 SOPORTE
    Channel: "1552764778122846348", // 🔎┆soporte (panel)
    Logs: "1552764890849083615", // 🎫┆log-tickets
  },
  voice: {
    Category: "1552764759839866930", // 🔊 VOZ
    Channel: "1553182867583012874", // ➕┆Crear sala
    ChannelName: "{emoji} {channel name}",
  },
  stats: {
    Members: "1553182876055638188",
    Boost: "1553182877267787827",
    Channels: "1553182879046172763",
    Roles: "1553182882267144343",
  },
};

function log(text) {
  console.log(chalk.blue(chalk.bold(`Setup`)), chalk.white(`>>`), chalk.green(text));
}

module.exports = async (client) => {
  const guild = client.guilds.cache.get(setup.guild);
  if (!guild) return;

  log(`Configurando los sistemas de ${guild.name}...`);

  try {
    // Sistemas que solo necesitan un canal
    for (const [model, channelId] of Object.entries(setup.channels)) {
      const Schema = require(`../../database/models/${model}`);
      await Schema.findOneAndUpdate(
        { Guild: guild.id },
        { $set: { Channel: channelId } },
        { upsert: true },
      );
    }

    // Mensajes de inicio de los juegos (solo si el canal está vacío)
    const games = [
      [setup.channels.countChannel, `🔢・Contar`, `¡Aquí empieza el conteo! El primer número es **1**`],
      [setup.channels.guessNumber, `🔢・Adivina el número`, `¡Adivina el número entre **1** y **10.000**!`],
      [setup.channels.guessWord, `💬・Adivina la palabra`, `¡Pon las letras en la posición correcta! \n\n🔀 ${"start".split("").sort(() => 0.5 - Math.random()).join("")}`],
      [setup.channels.wordsnake, `🐍・Serpiente de palabras`, `Escribe una palabra que empiece por la última letra de la anterior. ¡Empieza tú!`],
    ];
    for (const [channelId, title, desc] of games) {
      const channel = guild.channels.cache.get(channelId);
      const last = await channel?.messages.fetch({ limit: 1 }).catch(() => null);
      if (channel && last && last.size === 0) await client.embed({ title, desc }, channel);
    }

    // Tickets y su panel
    const Tickets = require("../../database/models/tickets");
    const hadTickets = await Tickets.exists({ Guild: guild.id });
    await Tickets.findOneAndUpdate(
      { Guild: guild.id },
      { $set: setup.tickets },
      { upsert: true },
    );
    const panel = guild.channels.cache.get(setup.tickets.Channel);
    const panelMessages = await panel?.messages.fetch({ limit: 20 }).catch(() => null);
    const hasPanel = panelMessages?.some((m) =>
      m.components.some((row) => row.components.some((c) => c.customId === "Bot_openticket")),
    );
    if (panel && !hasPanel) {
      const Discord = require("discord.js");
      const row = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setCustomId("Bot_openticket")
          .setLabel("Abrir ticket")
          .setStyle(Discord.ButtonStyle.Primary)
          .setEmoji("🎫"),
      );
      await client.embed(
        {
          title: `🎫・Soporte de ${guild.name}`,
          desc: `¿Necesitas ayuda del staff? Pulsa el botón para abrir un ticket y te atenderemos lo antes posible.`,
          components: [row],
        },
        panel,
      );
    }
    if (hadTickets) log("Tickets actualizados");

    // Voz personalizada
    const Voice = require("../../database/models/voice");
    await Voice.findOneAndUpdate(
      { Guild: guild.id },
      { $set: setup.voice },
      { upsert: true },
    );

    // Estadísticas del servidor
    const Stats = require("../../database/models/stats");
    await Stats.findOneAndUpdate(
      { Guild: guild.id },
      { $set: setup.stats },
      { upsert: true },
    );

    // Niveles activados
    const Functions = require("../../database/models/functions");
    await Functions.findOneAndUpdate(
      { Guild: guild.id },
      { $set: { Levels: true } },
      { upsert: true },
    );

    log(`¡Listo! Todos los sistemas están conectados. Ya puedes quitar SERVER_SETUP del .env`);
  } catch (error) {
    console.log(chalk.red(`Setup >> Error configurando los sistemas: ${error.message}`));
  }
};
