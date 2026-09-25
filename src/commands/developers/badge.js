const Discord = require("discord.js");

const model = require("../../database/models/badge");

const webhookClientLogs = new Discord.WebhookClient({
  id: "",
  token: "",
});

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const badgeFlags = {
    DEVELOPER: client.emotes.badges.developer,
    EVENT: client.emotes.badges.event,
    BOOSTER: client.emotes.badges.booster,
    BUGS: client.emotes.badges.bug,
    MANAGEMENT: client.emotes.badges.management,
    PREMIUM: client.emotes.badges.premium,
    SUPPORTER: client.emotes.badges.supporter,
    TEAM: client.emotes.badges.team,
    BOOSTER: client.emotes.badges.booster,
    PARTNER: client.emotes.badges.partner,
    VOTER: client.emotes.badges.voter,
    SUPPORT: client.emotes.badges.support,
    MODERATOR: client.emotes.badges.moderator,
    DESIGNER: client.emotes.badges.designer,
    MARKETING: client.emotes.badges.marketing,
    ACTIVE: client.emotes.badges.active,
    VIP: client.emotes.badges.vip,
  };

  const boolean = interaction.options.getBoolean("new");
  const member = interaction.options.getUser("user");
  const badge = interaction.options.getString("badge");

  let Badges = await model.findOne({ User: member.id });

  if (!badgeFlags[badge.toUpperCase()])
    return client.errNormal(
      {
        error: `No encuentro esa insignia`,
        type: `editreply`,
      },
      interaction,
    );

  if (boolean == true) {
    if (Badges) {
      if (Badges.FLAGS.includes(badge.toUpperCase()))
        return client.errNormal(
          {
            error: `¡Este usuario ya tiene esa insignia!`,
            type: `editreply`,
          },
          interaction,
        );

      let FLAG = badge.toUpperCase();
      let array = Badges.FLAGS;

      array.push(FLAG);

      model.findOne({ User: member.id }).then(async (data) => {
        if (err) console.log(err);
        data.FLAGS = array;
        data.save();
      });

      client.succNormal(
        {
          text: `¡Se añadió la insignia ${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()})!`,
          type: `editreply`,
        },
        interaction,
      );
    } else {
      const newSettings = new model({
        User: member.id,
        FLAGS: [badge.toUpperCase()],
      });
      await newSettings.save().catch(() => {});

      client.succNormal(
        {
          text: `¡Se añadió la insignia ${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()})!`,
          type: `editreply`,
        },
        interaction,
      );
    }

    let embedLogs = new Discord.EmbedBuilder()
      .setTitle(`📛・Insignia añadida`)
      .setDescription(`Se añadió una nueva insignia a ${member} (${member.id})`)
      .addFields(
        {
          name: "👤┆Añadida por",
          value: `${interaction.user} (${interaction.user.tag})`,
          inline: true,
        },
        {
          name: `📛┆Insignia`,
          value: `${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()})`,
          inline: true,
        },
      )
      .setColor(client.config.colors.normal)
      .setFooter({ text: client.config.discord.footer })
      .setTimestamp();
    webhookClientLogs.send({
      username: "Bot Badges",
      embeds: [embedLogs],
    });
  } else if (boolean == false) {
    if (!Badges.FLAGS.includes(badge.toUpperCase()))
      return client.errNormal(
        {
          error: `El usuario no tiene esa insignia`,
          type: `editreply`,
        },
        interaction,
      );

    let FLAG = badge.toUpperCase();
    let array = Badges.FLAGS;

    for (var i = 0; i < array.length; i++) {
      if (array[i] === FLAG) {
        array.splice(i, 1);
        i--;
      }
    }

    if (!array[0]) {
      let deleted = await model.deleteMany({ User: member.id });
      client.succNormal(
        {
          text: `Se quitó la insignia ${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()}). El usuario ya no tiene insignias, así que se eliminó del sistema de insignias.`,
          type: "editreply",
        },
        interaction,
      );
    } else {
      model.findOne({ User: member.id }).then(async (data) => {
        data.FLAGS = array;
        data.save();
      });
      client.succNormal(
        {
          text: `¡Se quitó la insignia ${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()})!`,
          type: "editreply",
        },
        interaction,
      );
    }

    let embedLogs = new Discord.EmbedBuilder()
      .setTitle(`📛・Insignia quitada`)
      .setDescription(`Se quitó una insignia a ${member} (${member.id})`)
      .addFields(
        {
          name: "👤┆Quitada por",
          value: `${interaction.user} (${interaction.user.tag})`,
          inline: true,
        },
        {
          name: `📛┆Insignia`,
          value: `${badgeFlags[badge.toUpperCase()]} (${badge.toUpperCase()})`,
          inline: true,
        },
      )
      .setColor(client.config.colors.normal)
      .setFooter({ text: client.config.discord.footer })
      .setTimestamp();
    webhookClientLogs.send({
      username: "Bot Badges",
      embeds: [embedLogs],
    });
  }
};
