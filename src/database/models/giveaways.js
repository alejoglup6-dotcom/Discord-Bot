const db = require('../odm');

const Schema = new db.Schema({
    messageId: String,
    channelId: String,
    guildId: String,
    startAt: Number,
    endAt: Number,
    ended: Boolean,
    winnerCount: Number,
    prize: String,
    messages: {
        giveaway: String,
        giveawayEnded: String,
        inviteToParticipate: String,
        drawing: String,
        dropMessage: String,
        winMessage: db.Mixed,
        embedFooter: db.Mixed,
        noWinner: String,
        winners: String,
        endedAt: String,
        hostedBy: String
    },
    thumbnail: String,
    hostedBy: String,
    winnerIds: { type: [String], default: undefined },
    reaction: db.Mixed,
    botsCanWin: Boolean,
    embedColor: db.Mixed,
    embedColorEnd: db.Mixed,
    exemptPermissions: { type: [], default: undefined },
    exemptMembers: String,
    bonusEntries: String,
    extraData: db.Mixed,
    lastChance: {
        enabled: Boolean,
        content: String,
        threshold: Number,
        embedColor: db.Mixed
    },
    pauseOptions: {
        isPaused: Boolean,
        content: String,
        unPauseAfter: Number,
        embedColor: db.Mixed,
        durationAfterPause: Number
    },
    isDrop: Boolean,
    allowedMentions: {
        parse: { type: [String], default: undefined },
        users: { type: [String], default: undefined },
        roles: { type: [String], default: undefined }
    }
});

module.exports = db.model("giveaways", Schema);