const db = require('../odm');

const Schema = new db.Schema({
    Guild: String,
    Members: String,
    Boost: String,
    Channels: String,
    Roles: String,
    Emojis: String,
    AnimatedEmojis: String,
    NewsChannels: String,
    StageChannels: String,
    StaticEmojis: String,
    TextChannels: String,
    BoostTier: String,
    VoiceChannels: String,
    Time: String,
    TimeZone: String,
    ChannelTemplate: String,
});

module.exports = db.model("stats", Schema);