const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  if (!interaction.member.voice.channel)
    return client.errNormal(
      {
        error: `¡No estás en un canal de voz!`,
        type: "editreply",
      },
      interaction,
    );

  let channel = interaction.member.voice
    ? interaction.member.voice.channel
    : null;
  if (!channel)
    return client.errNormal(
      {
        error: `¡El canal no existe!`,
        type: "editreply",
      },
      interaction,
    );

  let player = client.player.players.get(interaction.guild.id);

  if (player && channel.id !== player?.voiceId)
    return client.errNormal(
      {
        error: `¡No estás en el mismo canal de voz!`,
        type: "editreply",
      },
      interaction,
    );

  if (!player) {
    if (!channel.joinable)
      return client.errNormal(
        {
          error: `No se puede entrar a ese canal`,
          type: "editreply",
        },
        interaction,
      );

    player = await client.player.createPlayer({
      guildId: interaction.guild.id,
      voiceId: channel.id,
      textId: interaction.channel.id,
      deaf: true,
    });

    setTimeout(() => {
      if (channel.type == Discord.ChannelType.GuildStageVoice) {
        interaction.guild.members.me.voice.setSuppressed(false);
      }
    }, 500);
  }

  player = client.player.players.get(interaction.guild.id);

  var query = interaction.options.getString("song");

  client.simpleEmbed(
    {
      desc: `🔎┆Buscando...`,
      type: "editreply",
    },
    interaction,
  );

  const res = await player.search(query, { requester: interaction.user });

  if (!res.tracks.length) {
    if (!player.queue.current) player.destroy().catch(() => {});
    return client.errNormal(
      {
        error: `Error al obtener la música. Inténtalo de nuevo en unos minutos`,
        type: "editreply",
      },
      interaction,
    );
  }

  switch (res.type) {
    case "TRACK": {
      const track = res.tracks[0];
      await player.queue.add(track);

      if (!player.playing && !player.paused) {
        player.play();
      } else {
        client.embed(
          {
            title: `${client.emotes.normal.music}・${track.title}`,
            url: track.uri,
            desc: `¡La canción se añadió a la cola!`,
            thumbnail: track.thumbnail,
            fields: [
              {
                name: `👤┆Pedida por`,
                value: `${track.requester}`,
                inline: true,
              },
              {
                name: `${client.emotes.normal.clock}┆Termina a las`,
                value: `<t:${(Date.now() / 1000 + track.length / 1000).toFixed(0)}:f>`,
                inline: true,
              },
              {
                name: `🎬┆Autor`,
                value: `${track.author}`,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      }
      break;
    }

    case "PLAYLIST": {
      await player.queue.add(res.tracks);
      if (!player.playing && !player.paused) player.play();
      else {
      }
      break;
    }

    case "SEARCH": {
      let max = 5,
        collected,
        filter = (i) => i.user.id === interaction.user.id;
      if (res.tracks.length < max) max = res.tracks.length;

      let row = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setEmoji("1️⃣")
          .setCustomId("1")
          .setStyle(Discord.ButtonStyle.Secondary),

        new Discord.ButtonBuilder()
          .setEmoji("2️⃣")
          .setCustomId("2")
          .setStyle(Discord.ButtonStyle.Secondary),

        new Discord.ButtonBuilder()
          .setEmoji("3️⃣")
          .setCustomId("3")
          .setStyle(Discord.ButtonStyle.Secondary),

        new Discord.ButtonBuilder()
          .setEmoji("4️⃣")
          .setCustomId("4")
          .setStyle(Discord.ButtonStyle.Secondary),

        new Discord.ButtonBuilder()
          .setEmoji("5️⃣")
          .setCustomId("5")
          .setStyle(Discord.ButtonStyle.Secondary),
      );

      let row2 = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
          .setEmoji("🛑")
          .setLabel("Cancelar")
          .setCustomId("cancel")
          .setStyle(Discord.ButtonStyle.Danger),
      );

      const results = res.tracks
        .slice(0, max)
        .map(
          (track, index) =>
            `**[#${++index}]**┆${track.title.length >= 45 ? `${track.title.slice(0, 45)}...` : track.title}`,
        )
        .join("\n");

      client.embed(
        {
          title: `🔍・Resultados de la búsqueda`,
          desc: results,
          fields: [
            {
              name: `❓┆¿Cancelar la búsqueda?`,
              value: `Escribe \`cancel\` para detener la búsqueda`,
              inline: true,
            },
          ],
          components: [row, row2],
          type: "editreply",
        },
        interaction,
      );

      let i;
      try {
        i = await interaction.channel.awaitMessageComponent({
          filter,
          max: 1,
          time: 30e3,
          componentType: Discord.ComponentType.Button,
          errors: ["time"],
        });
      } catch (e) {
        if (!player.queue.current) player.destroy().catch(() => {});
        row.components.forEach((button) => button.setDisabled(true));
        row2.components.forEach((button) => button.setDisabled(true));
        return client.errNormal(
          {
            error: `No elegiste ninguna opción`,
            type: "editreply",
            components: [row, row2],
          },
          interaction,
        );
      }

      const first = i.customId;
      i.message.delete();
      i.deferUpdate();

      if (first.toLowerCase() === "cancel") {
        if (!player.queue.current) player.destroy().catch(() => {});
        return interaction.channel.send("Selección cancelada.");
      }

      const index = Number(first) - 1;
      if (index < 0 || index > max - 1)
        return client.errNormal(
          {
            error: `El número que diste es demasiado pequeño o demasiado grande (1-${max})`,
            type: "editreply",
          },
          interaction,
        );

      const track = res.tracks[index];
      player.queue.add(track);

      if (!player.playing && !player.paused) {
        player.play();
      } else {
        client.embed(
          {
            title: `${client.emotes.normal.music}・${track.title}`,
            url: track.uri,
            desc: `¡La canción se añadió a la cola!`,
            thumbnail: track.thumbnail,
            fields: [
              {
                name: `👤┆Pedida por`,
                value: `${track.requester}`,
                inline: true,
              },
              {
                name: `${client.emotes.normal.clock}┆Termina a las`,
                value: `<t:${(Date.now() / 1000 + track.length / 1000).toFixed(0)}:f>`,
                inline: true,
              },
              {
                name: `🎬┆Autor`,
                value: `${track.author}`,
                inline: true,
              },
            ],
            type: "editreply",
          },
          interaction,
        );
      }
    }
  }
};
