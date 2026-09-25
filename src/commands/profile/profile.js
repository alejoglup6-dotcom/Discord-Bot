const model = require("../../database/models/badge");
const Schema = require("../../database/models/profile");
const CreditsSchema = require("../../database/models/votecredits");

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

  const flags = {
    ActiveDeveloper: "👨‍💻・Desarrollador activo",
    BugHunterLevel1: "🐛・Cazador de bugs de Discord",
    BugHunterLevel2: "🐛・Cazador de bugs de Discord",
    CertifiedModerator: "👮‍♂️・Moderador certificado",
    HypeSquadOnlineHouse1: "🏠・Miembro de House Bravery",
    HypeSquadOnlineHouse2: "🏠・Miembro de House Brilliance",
    HypeSquadOnlineHouse3: "🏠・Miembro de House Balance",
    HypeSquadEvents: "🏠・Eventos de HypeSquad",
    PremiumEarlySupporter: "👑・Early Supporter",
    Partner: "👑・Partner",
    Quarantined: "🔒・Quarantined", // Not sure if this is still a thing
    Spammer: "🔒・Spammer", // Not sure if this one works
    Staff: "👨‍💼・Staff de Discord",
    TeamPseudoUser: "👨‍💼・Equipo de Discord",
    VerifiedBot: "🤖・Bot verificado",
    VerifiedDeveloper: "👨‍💻・Desarrollador de bots verificado (pionero)",
  };

  const user = interaction.options.getUser("user") || interaction.user;

  Schema.findOne({ User: user.id }).then(async (data) => {
    if (data) {
      let Badges = await model.findOne({ User: user.id });

      let credits = 0;
      const creditData = await CreditsSchema.findOne({ User: user.id });

      if (Badges && Badges.FLAGS.includes("DEVELOPER")) {
        credits = "∞";
      } else if (creditData) {
        credits = creditData.Credits;
      }

      if (!Badges) Badges = { User: user.id };

      const userFlags = user.flags ? user.flags.toArray() : [];

      client.embed(
        {
          title: `${client.user.username}・Perfil`,
          desc: "_____",
          thumbnail: user.avatarURL({ dynamic: true }),
          fields: [
            {
              name: "👤┆Usuario",
              value: user.username,
              inline: true,
            },
            {
              name: "📘┆Discriminador",
              value: user.discriminator,
              inline: true,
            },
            {
              name: "🆔┆ID",
              value: user.id,
              inline: true,
            },
            {
              name: "👨‍👩‍👦┆Género",
              value: `${data.Gender || "Sin definir"}`,
              inline: true,
            },
            {
              name: "🔢┆Edad",
              value: `${data.Age || "Sin definir"}`,
              inline: true,
            },
            {
              name: "🎂┆Cumpleaños",
              value: `${data.Birthday || "Sin definir"}`,
              inline: true,
            },
            {
              name: "🎨┆Color favorito",
              value: `${data.Color || "Sin definir"}`,
              inline: true,
            },
            {
              name: "🐶┆Mascotas favoritas",
              value: `${data.Pets.join(", ") || "Sin definir"}`,
              inline: true,
            },
            {
              name: "🍕┆Comida favorita",
              value: `${data.Food.join(", ") || "Sin definir"}`,
              inline: true,
            },
            {
              name: "🎶┆Canciones favoritas",
              value: `${data.Songs.join(", ") || "Sin definir"}`,
              inline: true,
            },
            {
              name: "🎤┆Artistas favoritos",
              value: `${data.Artists.join(", ") || "Sin definir"}`,
              inline: true,
            },
            {
              name: "🎬┆Películas favoritas",
              value: `${data.Movies.join(", ") || "Sin definir"}`,
              inline: true,
            },
            {
              name: "👨‍🎤┆Actores favoritos",
              value: `${data.Actors.join(", ") || "Sin definir"}`,
              inline: true,
            },
            {
              name: "🏴┆Origen",
              value: `${data.Orgin || "Sin definir"}`,
              inline: true,
            },
            {
              name: "🎮┆Pasatiempos",
              value: `${data.Hobbys.join(", ") || "Sin definir"}`,
              inline: true,
            },
            {
              name: "😛┆Estado",
              value: `${data.Status || "Sin definir"}`,
              inline: true,
            },
            {
              name: "📛┆Insignias del bot",
              value: `${Badges.FLAGS ? Badges.FLAGS.map((flag) => badgeFlags[flag]).join(" ") : "Ninguna"}`,
              inline: true,
            },
            {
              name: "🏷️┆Insignias de Discord",
              value: `${userFlags.length ? userFlags.map((flag) => flags[flag]).join(", ") : "Ninguna" || "Ninguna"}`,
              inline: true,
            },
            {
              name: "💳┆Dcredits",
              value: `${credits || "Ninguno"}`,
              inline: true,
            },
            {
              name: "ℹ️┆Sobre mí",
              value: `${data.Aboutme || "Sin definir"}`,
              inline: false,
            },
          ],
          type: "editreply",
        },
        interaction,
      );
    } else {
      return client.errNormal(
        {
          error: "¡No se encontró ningún perfil! Crea uno con /profile create",
          type: "editreply",
        },
        interaction,
      );
    }
  });
};
