const Discord = require("discord.js");
require("./assets/utils/webhooks");
const fs = require("fs");

const { Connectors } = require("shoukaku");
const { Kazagumo, Plugins } = require("kazagumo");
const Spotify = require('kazagumo-spotify');

// Discord client
/**
 * @type {import("./typings.d").Client}
 */
const client = new Discord.Client({
    allowedMentions: {
        parse: ["users", "roles"],
        repliedUser: true,
    },
    partials: [
        Discord.Partials.Channel,
        Discord.Partials.GuildMember,
        Discord.Partials.Message,
        Discord.Partials.Reaction,
        Discord.Partials.User,
        Discord.Partials.GuildScheduledEvent,
    ],
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildBans,
        Discord.GatewayIntentBits.GuildEmojisAndStickers,
        Discord.GatewayIntentBits.GuildIntegrations,
        Discord.GatewayIntentBits.GuildWebhooks,
        Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.GuildMessageTyping,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.DirectMessageReactions,
        Discord.GatewayIntentBits.DirectMessageTyping,
        Discord.GatewayIntentBits.GuildScheduledEvents,
        Discord.GatewayIntentBits.MessageContent,
    ],
});

client.player = new Kazagumo(
    {
        defaultSearchEngine: "youtube",
        send: (guildId, payload) => {
            const guild = client.guilds.cache.get(guildId);
            if (guild) guild.shard.send(payload);
        },
        plugins: [
            new Plugins.PlayerMoved(client),
            ...(process.env.SPOTIFY_CLIENT_ID ? [new Spotify({
                clientId: process.env.SPOTIFY_CLIENT_ID,
                clientSecret: process.env.SPOTIFY_CLIENT_SECRET
            })] : []),
        ]
    },
    new Connectors.DiscordJS(client),
    getLavalinkNodes(),
    {
        resume: true,
        resumeTimeout: 30,
        reconnectTries: 10,
    },
);

// Nodos de Lavalink v4. El de .env va primero; los públicos sirven de respaldo
// si el tuyo se cae (desactívalos con LAVALINK_FALLBACK=false).
function getLavalinkNodes() {
    const nodes = [];
    const host = process.env.LAVALINK_HOST?.trim();

    // lava.link ya no existe, pero venía en el .env.example antiguo
    if (host && host !== "lava.link") {
        const port = process.env.LAVALINK_PORT?.trim() || "443";
        nodes.push({
            name: "Lavalink principal",
            url: `${host}:${port}`,
            auth: process.env.LAVALINK_PASSWORD?.trim() || "youshallnotpass",
            secure: process.env.LAVALINK_SECURE
                ? process.env.LAVALINK_SECURE.trim() === "true"
                : port === "443",
        });
    }

    if (process.env.LAVALINK_FALLBACK !== "false" || !nodes.length) {
        nodes.push(
            {
                name: "Serenetia",
                url: "lavalinkv4.serenetia.com:443",
                auth: "https://seretia.link/discord",
                secure: true,
            },
            {
                name: "AjieDev",
                url: "lava-v4.ajieblogs.eu.org:443",
                auth: "https://dsc.gg/ajidevserver",
                secure: true,
            },
        );
    }

    return nodes;
}

const musicEvents = {
    playerStart: require("./music/trackStart"),
    playerEmpty: require("./music/queueEnd"),
    playerMoved: require("./music/playerMove"),
    playerClosed: require("./music/playerDisconnect"),
};
for (const [name, event] of Object.entries(musicEvents)) {
    client.player.on(name, event.bind(null, client));
}
client.player.shoukaku.on("ready", require("./music/ready").bind(null, client));
client.player.shoukaku.on("error", require("./music/error").bind(null, client));

// Connect to database
require("./database/connect")();

// Client settings
client.config = require("./config/bot");
client.changelogs = require("./config/changelogs");
client.emotes = require("./config/emojis.json");
client.webhooks = require("./config/webhooks.json");
const webHooksArray = [
    "startLogs",
    "shardLogs",
    "errorLogs",
    "dmLogs",
    "voiceLogs",
    "serverLogs",
    "serverLogs2",
    "commandLogs",
    "consoleLogs",
    "warnLogs",
    "voiceErrorLogs",
    "creditLogs",
    "evalLogs",
    "interactionLogs",
];
// Check if .env webhook_id and webhook_token are set
if (process.env.WEBHOOK_ID && process.env.WEBHOOK_TOKEN) {
    for (const webhookName of webHooksArray) {
        client.webhooks[webhookName].id = process.env.WEBHOOK_ID;
        client.webhooks[webhookName].token = process.env.WEBHOOK_TOKEN;
    }
}

client.commands = new Discord.Collection();
client.playerManager = new Map();
client.queue = new Map();

// Webhooks
const consoleLogs = new Discord.WebhookClient({
    id: client.webhooks.consoleLogs.id,
    token: client.webhooks.consoleLogs.token,
});

const warnLogs = new Discord.WebhookClient({
    id: client.webhooks.warnLogs.id,
    token: client.webhooks.warnLogs.token,
});

// Load handlers
fs.readdirSync("./src/handlers").forEach((dir) => {
    fs.readdirSync(`./src/handlers/${dir}`).forEach((handler) => {
        require(`./handlers/${dir}/${handler}`)(client);
    });
});

client.login(process.env.DISCORD_TOKEN);

process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error);
    if (error)
        if (error.length > 950)
            error = error.slice(0, 950) + "... view console for details";
    if (error.stack)
        if (error.stack.length > 950)
            error.stack =
                error.stack.slice(0, 950) + "... view console for details";
    if (!error.stack) return;
    const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・Promesa rechazada sin manejar`)
        .addFields([
            {
                name: "Error",
                value: error ? Discord.codeBlock(error) : "Sin error",
            },
            {
                name: "Pila del error",
                value: error.stack
                    ? Discord.codeBlock(error.stack)
                    : "Sin pila de error",
            },
        ])
        .setColor(client.config.colors.normal);
    consoleLogs
        .send({
            username: "Bot Logs",
            embeds: [embed],
        })
        .catch(() => {
            console.log("Error sending unhandledRejection to webhook");
            console.log(error);
        });
});

process.on("warning", (warn) => {
    console.warn("Warning:", warn);
    const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・Nueva advertencia encontrada`)
        .addFields([
            {
                name: `Advertencia`,
                value: `\`\`\`${warn}\`\`\``,
            },
        ])
        .setColor(client.config.colors.normal);
    warnLogs
        .send({
            username: "Bot Logs",
            embeds: [embed],
        })
        .catch(() => {
            console.log("Error sending warning to webhook");
            console.log(warn);
        });
});

client.on(Discord.ShardEvents.Error, (error) => {
    console.log(error);
    if (error)
        if (error.length > 950)
            error = error.slice(0, 950) + "... view console for details";
    if (error.stack)
        if (error.stack.length > 950)
            error.stack =
                error.stack.slice(0, 950) + "... view console for details";
    if (!error.stack) return;
    const embed = new Discord.EmbedBuilder()
        .setTitle(`🚨・Una conexión websocket encontró un error`)
        .addFields([
            {
                name: `Error`,
                value: `\`\`\`${error}\`\`\``,
            },
            {
                name: `Pila del error`,
                value: `\`\`\`${error.stack}\`\`\``,
            },
        ])
        .setColor(client.config.colors.normal);
    consoleLogs.send({
        username: "Bot Logs",
        embeds: [embed],
    });
});
