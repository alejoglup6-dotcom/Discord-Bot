const Discord = require("discord.js");

const Schema = require("../../database/models/family");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const target = interaction.options.getUser("user");
  const author = interaction.user;

  if (author.id == target.id)
    return client.errNormal(
      {
        error: "No puedes adoptarte a ti mismo",
        type: "editreply",
      },
      interaction,
    );

  if (target.bot)
    return client.errNormal(
      {
        error: "No puedes adoptar a un bot",
        type: "editreply",
      },
      interaction,
    );

  const familyMember = await Schema.findOne({
    Guild: interaction.guild.id,
    User: target.id,
    Parent: author.id,
  });
  const familyMember2 = await Schema.findOne({
    Guild: interaction.guild.id,
    User: author.id,
    Parent: target.id,
  });
  const familyMember3 = await Schema.findOne({
    Guild: interaction.guild.id,
    User: author.id,
    Partner: target.id,
  });

  if (familyMember || familyMember2 || familyMember3) {
    return client.errNormal(
      {
        error: `¡No puedes adoptar a un miembro de tu familia!`,
        type: "editreply",
      },
      interaction,
    );
  }

  const checkAdopt = await Schema.findOne({
    Guild: interaction.guild.id,
    Children: target.username,
  });
  if (checkAdopt) {
    return client.errNormal(
      {
        error: `Este usuario ya fue adoptado`,
        type: "editreply",
      },
      interaction,
    );
  }

  const row = new Discord.ActionRowBuilder().addComponents(
    new Discord.ButtonBuilder()
      .setCustomId("adopt_yes")
      .setEmoji("✅")
      .setStyle(Discord.ButtonStyle.Success),

    new Discord.ButtonBuilder()
      .setCustomId("adopt_deny")
      .setEmoji("❌")
      .setStyle(Discord.ButtonStyle.Danger),
  );

  client.embed(
    {
      title: `👪・Adopción`,
      desc: `¡${author} le pidió a ${target} adoptarlo! \n${target}, haz clic en uno de los botones`,
      components: [row],
      content: `${target}`,
      type: "editreply",
    },
    interaction,
  );

  const filter = (i) => i.user.id === target.id;

  interaction.channel
    .awaitMessageComponent({
      filter,
      componentType: Discord.ComponentType.Button,
      time: 60000,
    })
    .then(async (i) => {
      if (i.customId == "adopt_yes") {
        Schema.findOne({ Guild: interaction.guild.id, User: author.id }).then(
          async (data) => {
            if (data) {
              data.Children.push(target.username);
              data.save();
            } else {
              new Schema({
                Guild: interaction.guild.id,
                User: author.id,
                Children: target.username,
              }).save();
            }
          },
        );

        Schema.findOne({ Guild: interaction.guild.id, User: target.id }).then(
          async (data) => {
            if (data) {
              data.Parent.push(author.username);
              data.save();
            } else {
              new Schema({
                Guild: interaction.guild.id,
                User: target.id,
                Parent: author.username,
              }).save();
            }
          },
        );

        client.embed(
          {
            title: `👪・Adopción - Aceptada`,
            desc: `¡${author} ahora es el orgulloso padre de ${target}! 🎉`,
            components: [],
            type: "editreply",
          },
          interaction,
        );
      }

      if (i.customId == "adopt_deny") {
        client.embed(
          {
            title: `👪・Adopción - Rechazada`,
            desc: `${target} no quiere ser adoptado por ${author}`,
            components: [],
            type: "editreply",
          },
          interaction,
        );
      }
    })
    .catch(() => {
      client.embed(
        {
          title: `👪・Adopción - Rechazada`,
          desc: `¡${target} no respondió! Se canceló la adopción`,
          components: [],
          type: "editreply",
        },
        interaction,
      );
    });
};
