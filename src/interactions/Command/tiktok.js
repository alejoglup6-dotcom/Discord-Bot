const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

const tiktokCreators = require("../../database/models/tiktokCreators");
const { textChannel } = require("../../assets/utils/guildLookup");
const { OFFICIAL, cleanUser, fetchProfile, mentionsOfficial } = require("../../assets/utils/tiktok");

/*
 * /tiktok user:<usuario> — un creador de contenido registra su TikTok. El bot avisa en el canal 🎵┆tiktok de sus
 * videos que mencionan a la cuenta oficial (src/handlers/functions/tiktok.js). Un TikTok por miembro; volver a usarlo
 * lo cambia. quitar:true lo borra. El staff (Gestionar servidor) puede registrar o quitar el de otro con miembro.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("tiktok")
    .setDescription(`Registra tu TikTok de creador: el bot publica tus videos que mencionan a @${OFFICIAL}`)
    .addStringOption((o) => o.setName("user").setDescription("Tu usuario de TikTok (sin @) o el enlace a tu perfil").setRequired(true))
    .addBooleanOption((o) => o.setName("quitar").setDescription("Quitar este TikTok del registro"))
    .addUserOption((o) => o.setName("miembro").setDescription("Staff: registrar o quitar el TikTok de otro miembro")),

  run: async (client, interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const guild = interaction.guild;
    const err = (error) => client.errNormal({ error, type: "editreply" }, interaction);

    const account = cleanUser(interaction.options.getString("user"));
    if (!account) return err("Ese usuario de TikTok no es válido. Escribe solo el usuario (ej. sampcity.fan) o el enlace a tu perfil.");
    if (account === OFFICIAL) return err(`@${OFFICIAL} es la cuenta oficial: sus videos ya se publican solos.`);

    const other = interaction.options.getUser("miembro");
    const staff = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
    if (other && other.id !== interaction.user.id && !staff) return err("Solo el staff puede registrar el TikTok de otro miembro.");
    const userId = (other || interaction.user).id;

    const taken = await tiktokCreators.findOne({ Guild: guild.id, TikTok: account });

    if (interaction.options.getBoolean("quitar")) {
      if (!taken) return err(`@${account} no está registrado.`);
      if (taken.User !== interaction.user.id && !staff) return err("Ese TikTok lo registró otro miembro.");
      await taken.deleteOne();
      return client.succNormal({ text: `@${account} ya no está registrado: el bot deja de publicar sus videos.`, type: "editreply" }, interaction);
    }

    if (taken && taken.User !== userId) return err(`@${account} ya lo registró <@${taken.User}>. Si es tuyo, pídele al staff que lo revise.`);

    let profile;
    try {
      profile = await fetchProfile(account);
    } catch (e) {
      return err("TikTok no responde ahora mismo. Prueba en unos minutos.");
    }
    if (!profile.exists) return err(`No se encontró @${account} en TikTok, o la cuenta es privada. Tiene que ser pública para leer sus videos.`);

    // un TikTok por miembro: si ya tenía otro, se cambia
    const previous = await tiktokCreators.findOne({ Guild: guild.id, User: userId });
    if (previous) {
      previous.TikTok = account;
      previous.Date = Date.now();
      await previous.save();
    } else {
      await new tiktokCreators({ Guild: guild.id, User: userId, TikTok: account, Date: Date.now() }).save();
    }

    const mentions = profile.videos.filter((v) => mentionsOfficial(v.desc)).length;
    const posted = client.tiktokCreatorFirstPosts ? await client.tiktokCreatorFirstPosts(guild, { User: userId, TikTok: account }, profile.videos) : 0;
    const channel = textChannel(guild, /^tiktok$/);
    const where = channel ? `${channel}` : "el canal de TikTok";

    let text = `${other ? `<@${userId}>` : "Tu TikTok"} quedó registrado como **@${account}**.\n`;
    text += `Cada video que suba mencionando a **@${OFFICIAL}** en la descripción se publica en ${where} (se revisa cada 10 minutos).`;
    if (posted) text += `\n\nYa publiqué ${posted === 1 ? "su último video" : `sus últimos ${posted} videos`} con la mención.`;
    else if (!mentions) text += `\n\nEn sus videos recientes todavía no hay ninguno que mencione a @${OFFICIAL}.`;
    if (!channel) text += "\n\n⚠️ No encuentro el canal de TikTok en este servidor: hasta que exista no se publica nada.";
    return client.succNormal({ text, type: "editreply" }, interaction);
  },
};
