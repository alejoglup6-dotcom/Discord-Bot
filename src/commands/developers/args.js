const Discord = require("discord.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const message = interaction.options.getString("message");

  client.succNormal(
    {
      text: `¡El mensaje se envió correctamente!`,
      type: "ephemeraledit",
    },
    interaction,
  );

  if (message == "information") {
    client
      .simpleEmbed(
        {
          image: `https://cdn.discordapp.com/attachments/843487478881976381/874742689017520128/Bot_banner_information.jpg`,
        },
        interaction.channel,
      )
      .then(() => {
        client.embed(
          {
            title: `ℹ️・Información`,
            thumbnail: client.user.avatarURL({ size: 1024 }),
            desc: `_____`,
            fields: [
              {
                name: `👋┆¡Bienvenido a ${interaction.guild.name}!`,
                value: `¡Bienvenido a nuestro lugar de reunión! Conoce gente nueva, juega y participa en eventos de temporada. Somos un servidor que reúne a todos e intentamos que todo el mundo se sienta cómodo. ¡Estás en tu casa, diviértete!`,
              },
              {
                name: `❓┆¿Qué puedo hacer aquí?`,
                value: `- ¡Conocer gente nueva! \n- ¡Jugar muchos juegos divertidos! \n- ¡Descubrir las temporadas! \n- ¡Participar en eventos! \nY por último, pero no menos importante, ¡elige tus propios roles en <#847867992044994561>!`,
              },
              {
                name: `🎫┆¿Cómo consigo ayuda si la necesito?`,
                value: `¡Puedes abrir un ticket en <#820308164322656327>! Con gusto responderemos tus preguntas y te daremos soporte.`,
              },
              {
                name: `⚙️┆¡Quiero ayudar a mejorar Bot Hangout!`,
                value: `- ¡Ve a solicitudes y mira qué puestos hay disponibles! \n- ¡O abre un ticket y pregunta si puedes ayudar con algo! \n\n**¡Te deseamos un rato muy agradable aquí!**`,
              },
            ],
          },
          interaction.channel,
        );
      });
  }

  if (message == "rules") {
    client
      .simpleEmbed(
        {
          image: `https://cdn.discordapp.com/attachments/843487478881976381/874742702393131038/Bot_banner_rules.jpg`,
        },
        interaction.channel,
      )
      .then(async () => {
        await client.embed(
          {
            title: `📃・Reglas`,
            thumbnail: client.user.avatarURL({ size: 1024 }),
            desc: `_____ \n\nEstas son las reglas del servidor. Respétalas para que todos lo pasen bien. Los administradores y moderadores podrán aislar, expulsar o banear a su criterio`,
          },
          interaction.channel,
        );

        await client.embed(
          {
            title: `1. Sé respetuoso`,
            desc: `Debes respetar a todos los usuarios, te caigan bien o no. Trata a los demás como quieres que te traten.`,
          },
          interaction.channel,
        );

        await client.embed(
          {
            title: `2. Nada de lenguaje inapropiado`,
            desc: `Mantén las groserías al mínimo. Cualquier lenguaje despectivo hacia otro usuario está prohibido.`,
          },
          interaction.channel,
        );

        await client.embed(
          {
            title: `3. Nada de spam`,
            desc: `No envíes muchos mensajes cortos seguidos. No interrumpas el chat haciendo spam.`,
          },
          interaction.channel,
        );

        await client.embed(
          {
            title: `4. Nada de material pornográfico, para adultos u otro contenido NSFW`,
            desc: `Este es un servidor de comunidad y no está pensado para compartir ese tipo de material.`,
          },
          interaction.channel,
        );

        await client.embed(
          {
            title: `5. Nada de publicidad`,
            desc: `No toleramos ningún tipo de publicidad, ni de otras comunidades ni de streams. Puedes publicar tu contenido en el canal de medios si es relevante y aporta valor real (vídeo/arte)`,
          },
          interaction.channel,
        );

        await client.embed(
          {
            title: `6. Nada de nombres ni fotos de perfil ofensivos`,
            desc: `Se te pedirá que cambies tu nombre o tu foto si el staff los considera inapropiados.`,
          },
          interaction.channel,
        );

        await client.embed(
          {
            title: `7. Raids al servidor`,
            desc: `No se permiten los raids ni hablar de hacer raids.`,
          },
          interaction.channel,
        );

        await client.embed(
          {
            title: `8. Amenazas directas e indirectas`,
            desc: `Las amenazas de DDoS, muerte, doxeo, abuso y cualquier otra amenaza maliciosa hacia otros usuarios están totalmente prohibidas.`,
          },
          interaction.channel,
        );

        await client.embed(
          {
            title: `9. Sigue las Directrices de la Comunidad de Discord`,
            desc: `Puedes encontrarlas aquí: https://discordapp.com/guidelines`,
          },
          interaction.channel,
        );

        await client.embed(
          {
            title: `10. No entres a canales de voz sin permiso de quienes ya están ahí`,
            desc: `Si ves que hay un hueco libre, puedes entrar y preguntar si hay sitio, pero vete si quienes estaban primero no quieren tu presencia`,
          },
          interaction.channel,
        );
      });
  }

  if (message == "applications") {
    client
      .simpleEmbed(
        {
          image: `https://cdn.discordapp.com/attachments/843487478881976381/874742737415581786/Bot_banner_applications.jpg`,
        },
        interaction.channel,
      )
      .then(() => {
        client.embed(
          {
            title: `💼・Solicitudes`,
            thumbnail: client.user.avatarURL({ size: 1024 }),
            desc: `_____ \n\n¿Qué puede ser más divertido que trabajar en el mejor bot/servidor? Con frecuencia abrimos nuevos puestos a los que puedes postularte \n\nPero... ¿qué puedes esperar?`,
            fields: [
              {
                name: `👥┆Un equipo muy agradable`,
                value: `¡En el equipo de Bot siempre hay buen ambiente y todos reciben el mismo trato!`,
              },
              {
                name: `🥳┆Acceso al programa beta`,
                value: `¡Accede a funciones de Bot aún no publicadas con tu propio servidor! ¡Serás un auténtico tester de Bot!`,
              },
              {
                name: `📛┆Un buen rango y una insignia`,
                value: `Recibirás un buen rango en el servidor y una insignia de equipo en nuestro comando userinfo. Todos verán que contribuyes al equipo`,
              },
              {
                name: `📖┆Aprende y crece`,
                value: `¡Entendemos que no siempre se entiende todo a la primera! En Bot te damos la oportunidad de aprender cosas nuevas y mejorar en tu puesto. ¡En el futuro también podrás pasar al equipo de dirección!`,
              },
              {
                name: `📘┆¿Qué significa cada cosa?`,
                value: `**Moderador** \nTe encargas de que el servidor sea y siga siendo divertido para todos. Chatea con nosotros y mantén todo bajo control \n\n**Marketing** \nTambién queremos crecer, y lo hacemos con un gran equipo de marketing. Sabes mejor que nadie cómo hacer crecer un servidor \n\n**Organización** \n¡Te encargarás de que el ambiente del servidor sea aún mejor! Junto a un equipo, preparas eventos nuevos y divertidos para que el servidor sea todavía más entretenido`,
              },
              {
                name: `📃┆¿Postularte?`,
                value: `¡Abre un ticket para recibir tu solicitud!`,
              },
            ],
          },
          interaction.channel,
        );
      });
  }

  if (message == "boosterperks") {
    client
      .simpleEmbed(
        {
          image: `https://media.discordapp.net/attachments/843487478881976381/881396544195149874/Bot_banner_boosters.jpg`,
        },
        interaction.channel,
      )
      .then(() => {
        client.embed(
          {
            title: `💎・Beneficios para boosters`,
            thumbnail: client.user.avatarURL({ size: 1024 }),
            desc: `_____ \n\n¿Quieres más opciones en el servidor? Conviértete en un verdadero booster de Bot y consigue buenos beneficios. Pero ¿qué recibes exactamente?`,
            fields: [
              {
                name: `😛┆Usar stickers externos`,
                value: `Usa stickers de otros servidores en nuestro servidor`,
              },
              {
                name: `🔊┆Enviar mensajes TTS`,
                value: `Envía mensajes con sonido`,
              },
              {
                name: `🤔┆Acceso a la sala oculta`,
                value: `¡Accede a una sala privada y chatea con otros boosters!`,
              },
              {
                name: `📛┆Cambiar tu apodo`,
                value: `Cambia tu nombre en el servidor. Así destacarás`,
              },
              {
                name: `💭┆Crear hilos públicos/privados`,
                value: `Crea un hilo en nuestros canales de texto`,
              },
              {
                name: `🎉┆Sorteos privados`,
                value: `Accede a sorteos exclusivos y divertidos`,
              },
              {
                name: `📂┆Enviar archivos en cualquier canal`,
                value: `Envía archivos en todos los canales donde puedas hablar`,
              },
              {
                name: `📊┆Acceso a un canal especial de promoción`,
                value: `Ten la oportunidad de promocionar tu propio servidor en un canal especial`,
              },
              {
                name: `😜┆Un rol personalizado a tu elección`,
                value: `Crea tu propio rol y configúralo tú mismo`,
              },
              {
                name: `💎┆Consigue el rol y la insignia de booster`,
                value: `¡Destaca con un buen rol de booster y una insignia de booster!`,
              },
              {
                name: `💻┆Acceso a nuevas actualizaciones beta de Bot`,
                value: `¡Tu servidor tendrá acceso a actualizaciones que aún no han salido! ¿No es genial?`,
              },
            ],
          },
          interaction.channel,
        );
      });
  }

  if (message == "links") {
    client
      .simpleEmbed(
        {
          image: `https://media.discordapp.net/attachments/843487478881976381/881396544195149874/Bot_banner_boosters.jpg`,
        },
        interaction.channel,
      )
      .then(() => {
        client.embed(
          {
            title: `🔗・Enlaces`,
            thumbnail: client.user.avatarURL({ size: 1024 }),
            desc: `_____ \n\n¡Mira todos los enlaces de Bot Network!`,
            fields: [
              {
                name: `▬▬│Servidores│▬▬`,
                value: ``,
              },
            ],
          },
          interaction.channel,
        );
      });
  }

  if (message == "rewards") {
    client.embed(
      {
        title: `😜・Recompensas de roles`,
        thumbnail: client.user.avatarURL({ size: 1024 }),
        desc: `_____ \n\n¿Quieres algunos extras en el servidor? ¿O quieres destacar más? Mira las recompensas abajo`,
        fields: [
          {
            name: `🏆┆Niveles`,
            value: `- Nivel 5   | <@&833307296699908097>\n- Nivel 10  | <@&833307450437664838>\n- Nivel 15  | <@&833307452279226379>\n- Nivel 30 | <@&915290300757458964>\n- Nivel 40 | <@&915290324480430080>`,
          },
          {
            name: `🥳┆Especial`,
            value: `- 1 voto al servidor | <@&833959913742794772>\n- 1 boost | <@&744208324022501447>\n- 1 donación | <@&849554599371210793>`,
          },
          {
            name: `💰┆Economía`,
            value: `- $10.000 | <@&890720270086733854>\n- $15.000 | <@&833936202725720084>\n- $20.000 | <@&833936185167839232> \n- $25.000 | <@&928236333309255711> \n- $30.000 | <@&928235747100733450>`,
          },
        ],
      },
      interaction.channel,
    );
  }

  if (message == "ourbots") {
    client
      .simpleEmbed(
        {
          image: `https://cdn.discordapp.com/attachments/843487478881976381/874742741224022016/Bot_banner_bot_info.jpg`,
        },
        interaction.channel,
      )
      .then(() => {
        client.embed(
          {
            title: `🤖・Nuestros bots`,
            thumbnail: client.user.avatarURL({ size: 1024 }),
            desc: `_____ \n\nAdemás de una comunidad, también mantenemos 2 bots públicos. ¡Todos están hechos para mejorar tu servidor!`,
            fields: [
              {
                name: `📘┆¿Qué es Bot?`,
                value: `¡Bot es un bot con el que puedes gestionar todo tu servidor! Con más de 400 comandos, es un bot enorme con muchas opciones para mejorar tu servidor. ¿Y sabes qué es lo mejor? ¡Todo es **GRATIS**!`,
              },
              {
                name: `🎶┆¿Qué es Bot 2?`,
                value: `Bot 2 se creó para tener música adicional. Así nunca se estorban cuando alguien ya está escuchando música. Además, este bot incluye un soundboard y un sistema de radio`,
              },
              {
                name: `📨┆¿Cómo invito a los bots?`,
                value: `Puedes invitar a los bots con \`/invite\` o haciendo clic en los enlaces de abajo \n\n**Bot** - [Invítalo aquí](${client.config.discord.botInvite})`,
              },
              {
                name: `🎫┆¿Cómo consigo ayuda si la necesito?`,
                value: `¡Puedes abrir un ticket en <#820308164322656327>! Con gusto responderemos tus preguntas y te daremos soporte.`,
              },
            ],
          },
          interaction.channel,
        );
      });
  }
};
