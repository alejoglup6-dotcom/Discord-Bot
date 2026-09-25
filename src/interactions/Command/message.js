const { CommandInteraction, Client } = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
const Discord = require("discord.js");
const model = require("../../database/models/badge");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("message")
    .setDescription("Publica mensajes predefinidos")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Elige un mensaje")
        .setRequired(true)
        .addChoices(
          { name: "Información", value: "information" },
          { name: "Reglas", value: "rules" },
          { name: "Solicitudes", value: "applications" },
          { name: "Ayuda", value: "helpdesk" },
          { name: "Red", value: "network" },
          { name: "Bot-Info", value: "botinfo" },
          { name: "Bot-Badges", value: "badges" },
          { name: "Bot-Béta", value: "beta" },
          { name: "Bot-Credits", value: "credits" },
        ),
    ),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {String[]} args
   */

  run: async (client, interaction, args) => {
    await interaction.deferReply({ withResponse: true });
    model.findOne({ User: interaction.user.id }).then(async (data) => {
      if (data && data.FLAGS.includes("DEVELOPER")) {
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
                image: `https://media.discordapp.net/attachments/937337957419999272/937338297036967946/techpoint_channel_banner_about.jpg?width=812&height=221`,
              },
              interaction.channel,
            )
            .then(() => {
              client.embed(
                {
                  title: `ℹ️・Información`,
                  author: {
                    name: "TechPoint",
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                  thumbnail:
                    "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                  fields: [
                    {
                      name: `👋┆¡Bienvenido a Bot Support!`,
                      value: `¡Bienvenido a tu servidor de soporte! Nos centramos en nuestros bots Bot y Bot 2. Mantente al día, haz tus preguntas y prueba nuestros bots.`,
                    },
                    {
                      name: `❓┆¿Qué puedo hacer aquí?`,
                      value: `- Lee las últimas noticias del bot\n- Prueba los comandos del bot\n- Haz preguntas\n- Recibe ayuda para configurar el bot en tu servidor`,
                    },
                    {
                      name: `🤖┆¿Qué son Bot y Bot 2?`,
                      value: `Puedes encontrar esta información en el canal <#897221483460444170>.`,
                    },
                    {
                      name: `🔗┆Nuestros otros servidores`,
                      value: `[Servidor tech](https://discord.gg/bEJhVa6Ttv) - Recibe ayuda con código, tecnología y cripto mientras lees las últimas noticias\n[Apelación de baneos](https://discord.gg/htf9pHNRxA) - ¿Te banearon? Pide que te desbaneen`,
                    },
                  ],
                  footer: {
                    text: `© TechPoint - 2022`,
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                },
                interaction.channel,
              );
            });
        }

        if (message == "rules") {
          client
            .simpleEmbed(
              {
                image: `https://media.discordapp.net/attachments/937337957419999272/937338297968123904/techpoint_channel_banner_rules.jpg?width=812&height=221`,
              },
              interaction.channel,
            )
            .then(() => {
              client.embed(
                {
                  title: `📃・Reglas`,
                  author: {
                    name: "TechPoint",
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                  thumbnail:
                    "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                  desc: `Estas son las reglas del servidor. Respétalas para que todos lo pasen bien. Los administradores y moderadores podrán aislar, expulsar o banear a su criterio`,
                  fields: [
                    {
                      name: `1. Sé respetuoso`,
                      value: `Debes respetar a todos los usuarios, te caigan bien o no. Trata a los demás como quieres que te traten.`,
                    },
                    {
                      name: `2. Nada de lenguaje inapropiado`,
                      value: `Mantén las groserías al mínimo. Cualquier lenguaje despectivo hacia otro usuario está prohibido.`,
                    },
                    {
                      name: `3. Nada de spam`,
                      value: `No envíes muchos mensajes cortos seguidos. No interrumpas el chat haciendo spam.`,
                    },
                    {
                      name: `4. Nada de material pornográfico, para adultos u otro contenido NSFW`,
                      value: `Este es un servidor de comunidad y no está pensado para compartir ese tipo de material.`,
                    },
                    {
                      name: `5. Nada de publicidad`,
                      value: `No toleramos ningún tipo de publicidad, ni de otras comunidades ni de streams. Puedes publicar tu contenido en el canal de medios si es relevante y aporta valor real (vídeo/arte)`,
                    },
                    {
                      name: `6. Nada de nombres ni fotos de perfil ofensivos`,
                      value: `Se te pedirá que cambies tu nombre o tu foto si el staff los considera inapropiados.`,
                    },
                    {
                      name: `7. Raids al servidor`,
                      value: `No se permiten los raids ni hablar de hacer raids.`,
                    },
                    {
                      name: `8. Amenazas directas e indirectas`,
                      value: `Las amenazas de DDoS, muerte, doxeo, abuso y cualquier otra amenaza maliciosa hacia otros usuarios están totalmente prohibidas.`,
                    },
                    {
                      name: `9. Sigue las Directrices de la Comunidad de Discord`,
                      value: `Puedes encontrarlas aquí: https://discordapp.com/guidelines`,
                    },
                    {
                      name: `10. No entres a canales de voz sin permiso de quienes ya están ahí`,
                      value: `Si ves que hay un hueco libre, puedes entrar y preguntar si hay sitio, pero vete si quienes estaban primero no quieren tu presencia`,
                    },
                  ],
                  footer: {
                    text: `© TechPoint - 2022`,
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                },
                interaction.channel,
              );
            });
        }

        if (message == "applications") {
          client
            .simpleEmbed(
              {
                image: `https://media.discordapp.net/attachments/937337957419999272/938725909068918854/techpoint_channel_banner_applications.jpg?width=812&height=221`,
              },
              interaction.channel,
            )
            .then(() => {
              client.embed(
                {
                  title: `💼・Solicitudes`,
                  author: {
                    name: "TechPoint",
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                  thumbnail:
                    "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                  desc: `¿Qué puede ser más divertido que trabajar en el mejor bot/servidor? Con frecuencia abrimos nuevos puestos a los que puedes postularte \n\nPero... ¿qué puedes esperar?`,
                  fields: [
                    {
                      name: `👥┆Un equipo muy agradable`,
                      value: `¡En el equipo de Techpoint Network siempre hay buen ambiente y todos reciben el mismo trato!`,
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
                      value: `**Moderador/Soporte** \nTe encargas de que el servidor sea y siga siendo divertido para todos. Chatea con nosotros, mantén todo bajo control y ayuda a la gente con sus preguntas.\n\n**Marketing** \nTambién queremos crecer, y lo hacemos con un gran equipo de marketing. Sabes mejor que nadie cómo hacer crecer un servidor`,
                    },
                    {
                      name: `📃┆¿Postularte?`,
                      value: `¡Abre un ticket para recibir tu solicitud!`,
                    },
                  ],
                  footer: {
                    text: `© TechPoint - 2022`,
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                },
                interaction.channel,
              );
            });
        }

        if (message == "helpdesk") {
          client
            .simpleEmbed(
              {
                image: `https://media.discordapp.net/attachments/937337957419999272/938725908687233034/techpoint_channel_banner_helpdesk.jpg?width=812&height=221`,
              },
              interaction.channel,
            )
            .then(() => {
              client.embed(
                {
                  title: `🎫・Ayuda`,
                  author: {
                    name: "TechPoint",
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                  thumbnail:
                    "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                  desc: `¿Qué puede ser más divertido que trabajar en el mejor bot/servidor? Con frecuencia abrimos nuevos puestos a los que puedes postularte \n\nPero... ¿qué puedes esperar?`,
                  fields: [
                    {
                      name: `❓┆¡Tengo una pregunta!`,
                      value: `Te recomendamos hacer tu pregunta primero en <#937486956697370674>. Ahí suele haber miembros del equipo u otras personas que pueden ayudarte. Si aun así no se resuelve, abre un ticket.`,
                    },
                    {
                      name: `📄┆Reglas de los tickets`,
                      value: `**1.** Ten paciencia y no etiquetes sin necesidad \n**2.** Abre como máximo 1 ticket a la vez \n**3.** Nada de comportamiento inapropiado en los tickets \n**4.** No abras tickets por tonterías`,
                    },
                    {
                      name: `⏰┆Tiempo de respuesta`,
                      value: `**08:00 - 16:00** - (+/- 1 hora) \n**16:00 - 22:00** - (+/- 30 minutos) \n**22:00 - 08:00** - (+/- 1+ hora)`,
                    },
                  ],
                  footer: {
                    text: `© TechPoint - 2022`,
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                },
                interaction.channel,
              );
            });
        }

        if (message == "network") {
          client
            .simpleEmbed(
              {
                image: `https://media.discordapp.net/attachments/937337957419999272/938725909387698216/techpoint_channel_banner_network.jpg?width=812&height=221`,
              },
              interaction.channel,
            )
            .then(() => {
              client.embed(
                {
                  title: `🏢・Red`,
                  thumbnail:
                    "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                  author: {
                    name: "TechPoint",
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                  desc: `Techpoint Network es una red formada por 3 servidores. Cada servidor tiene su propia función: uno es para tecnología/programación/cripto y otro para soporte. También tenemos 1 servidor extra para apelaciones de baneos. Lee toda la información abajo`,
                  fields: [
                    {
                      name: `💻┇TechPoint`,
                      value: `Este servidor se centra en todo lo relacionado con la tecnología. Por ejemplo, cifrado, cripto o los últimos gadgets. ¡Conoce gente nueva o aprende más sobre tecnología! Puedes unirte a este servidor haciendo clic en [este](https://discord.gg/bEJhVa6Ttv) enlace`,
                    },
                    {
                      name: `🤖┇Bot Support`,
                      value: `Este es el servidor en el que estás ahora. Aquí encontrarás toda la información sobre este servidor. Puedes conseguir el enlace de este servidor haciendo clic en [este](https://discord.gg/GqhD6RNbzs) enlace`,
                    },
                    {
                      name: `🔨┇Apelaciones de baneo de TechPoint`,
                      value: `Este servidor es para las personas baneadas de un servidor o de los bots. Aquí puedes abrir un ticket para pedir que te desbaneen y volver a participar en los servidores o usar los bots. Puedes unirte a este servidor haciendo clic en [este](https://discord.gg/q9jZrDk9n6) enlace`,
                    },
                  ],
                  footer: {
                    text: `© TechPoint - 2022`,
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                },
                interaction.channel,
              );
            });
        }

        if (message == "botinfo") {
          client
            .simpleEmbed(
              {
                image: `https://media.discordapp.net/attachments/937337957419999272/938725909668691978/techpoint_channel_banner_Bot.jpg?width=812&height=221`,
              },
              interaction.channel,
            )
            .then(() => {
              client.embed(
                {
                  title: `ℹ・Información de los bots`,
                  author: {
                    name: "TechPoint",
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                  thumbnail:
                    "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                  desc: `Además de una comunidad, también mantenemos 2 bots públicos. ¡Todos están hechos para mejorar tu servidor!`,
                  fields: [
                    {
                      name: `🤖┆¿Qué es Bot?`,
                      value: `¡Bot es un bot con el que puedes gestionar todo tu servidor! Con más de 400 comandos, es un bot enorme con muchas opciones para mejorar tu servidor, y lo mejor es que funciona completamente con comandos de barra. ¿Y sabes qué más? ¡Todo es **GRATIS**!`,
                    },
                    {
                      name: `🎶┆¿Qué es Bot 2?`,
                      value: `Bot 2 se creó para tener música adicional. Así nunca se estorban cuando alguien ya está escuchando música. Además, este bot incluye un soundboard y un sistema de radio, ¡y funciona completamente con comandos de barra!`,
                    },
                    {
                      name: `📨┆¿Cómo invito a los bots?`,
                      value: `Puedes invitar a los bots con \`/invite\` o haciendo clic en los enlaces de abajo\n\n**Invitar a Bot** - [Invítalo aquí](https://discord.com/oauth2/authorize?&client_id=798144456528363550&scope=applications.commands+bot&permissions=8)\n**Invitar a Bot 2** - [Invítalo aquí](${client.config.discord.botInvite})`,
                    },
                    {
                      name: `🎫┆¿Cómo consigo ayuda si la necesito?`,
                      value: `Puedes hacer tus preguntas en el chat general o, para más información, echar un vistazo a <#897213893624102965>.`,
                    },
                  ],
                  footer: {
                    text: `© TechPoint - 2022`,
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                },
                interaction.channel,
              );
            });
        }

        if (message == "badges") {
          client.simpleEmbed(
            {
              image: `https://media.discordapp.net/attachments/937337957419999272/938725908028751882/techpoint_channel_banner_soon.jpg?width=813&height=221`,
            },
            interaction.channel,
          );
          // .then(() => {
          //     client.embed({
          //         title: `🥇・Badges`,
          //         thumbnail: "https://media.discordapp.net/attachments/937337957419999272/938725906728513576/techpoint_channel_banner_badges.jpg?width=813&height=221",
          //         desc: `We at Bot have a special badge system! You can find your badge via the userinfo command. Read below what each badge means`,
          //         fields: [
          //             {
          //                 name: `${client.emotes.badges.bot}┆Bot badge`,
          //                 value: `This badge is only available for the Bot(s). This way you can see even better that they belong together.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.developer}┆Developer badge`,
          //                 value: `This badge is only available to Bot developers. This shows that they are official developers of the bots.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.management}┆Management badge`,
          //                 value: `You can get this badge if you are an official management member of team Bot.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.team}┆Team badge`,
          //                 value: `You can get this badge if you are an official team member of team Bot.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.support}┆Support badge`,
          //                 value: `You can get this badge if you are an official support member of team Bot.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.moderator}┆Moderator badge`,
          //                 value: `You can get this badge if you are an official moderator of team Bot.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.marketing}┆Marketing badge`,
          //                 value: `You can get this badge if you are an official marketing member of team Bot.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.event}┆Organization badge`,
          //                 value: `You can get this badge if you are an official organization member of team Bot.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.designer}┆Designer badge`,
          //                 value: `You can get this badge if you are an official designer of team Bot.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.booster}┆Booster badge`,
          //                 value: `You can get this badge if you have boosted a server within our network.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.partner}┆Partner badge`,
          //                 value: `You can get this badge if you are official partnerd with our server.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.bug}┆Bug Hunter badge`,
          //                 value: `You can get this badge if you have reported more than 5 bugs in our bot.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.supporter}┆Supporter badge`,
          //                 value: `You can get this badge if you have given something to Bot to improve the bot even more.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.voter}┆Voter badge`,
          //                 value: `You can get this badge if you have voted for our bots or servers.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.vip}┆Vip badge`,
          //                 value: `You can get this badge if you have bought the vip role in the economy system.`,
          //             },
          //             {
          //                 name: `${client.emotes.badges.active}┆Active badge`,
          //                 value: `You can get this badge if you have bought the active role in the economy system.`,
          //             }
          //         ],
          //         footer: {
          //             text: `© TechPoint - 2022`,
          //             iconURL: "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812"
          //         }
          //     }, interaction.channel)
          // })
        }

        if (message == "beta") {
          client
            .simpleEmbed(
              {
                image: `https://media.discordapp.net/attachments/937337957419999272/938725907097604116/techpoint_channel_banner_beta.jpg?width=813&height=221`,
              },
              interaction.channel,
            )
            .then(() => {
              client.embed(
                {
                  title: `🐞・Béta`,
                  author: {
                    name: "TechPoint",
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                  thumbnail:
                    "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                  desc: `El programa beta de Bot es para actualizaciones nuevas que todavía tienen algunos bugs. ¡Gracias a este programa hay menos bugs en el lanzamiento! Todo se hace con otro bot, para que los usuarios actuales no se vean afectados por las pruebas beta`,
                  fields: [
                    {
                      name: `📃┆Requisitos para participar`,
                      value: `- Mínimo 50 miembros en el servidor \n- Nada de servidores de prueba \n- Cumplir los TOS de Discord y de Bot \n- Servidor activo`,
                    },
                    {
                      name: `❓┆¿Cómo funciona?`,
                      value: `Vas a usar un bot beta. Esto significa que en algunos aspectos el bot no funciona al 100%. ¡Tenlo en cuenta al inscribirte!`,
                    },
                    {
                      name: `💼┆¡Quiero postularme!`,
                      value: `¡Genial que quieras participar en Bot! Te pedimos que abras un ticket en <#897213893624102965>. Te enviaremos un formulario y posiblemente información adicional \n\n**¡Atención!** Cuando salga la actualización, se te sacará del programa`,
                    },
                  ],
                  footer: {
                    text: `© TechPoint - 2022`,
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                },
                interaction.channel,
              );
            });
        }

        if (message == "credits") {
          client
            .simpleEmbed(
              {
                image: `https://media.discordapp.net/attachments/937337957419999272/938725907659644928/techpoint_channel_banner_credits.png?width=813&height=221`,
              },
              interaction.channel,
            )
            .then(() => {
              client.embed(
                {
                  title: `${client.user.username}・Dcredits`,
                  author: {
                    name: "TechPoint",
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                  thumbnail:
                    "https://media.discordapp.net/attachments/937337957419999272/937463192265846784/techpoint_logo_Bot.jpg?width=812&height=812",
                  fields: [
                    {
                      name: `ℹ️┆¿Qué son los Dcredits?`,
                      value: `¡Los Dcredits son créditos que recibes al realizar ciertas acciones! Puedes canjearlos por buenos beneficios para ti y tu servidor`,
                    },
                    {
                      name: `❓┆¿Cómo se consiguen Dcredits?`,
                      value: `Por ahora solo recibes Dcredits al votar por Bot. ¡Puedes hacerlo en top.gg! Los créditos se añadirán automáticamente a tu cuenta`,
                    },
                    {
                      name: `💱┆¿Por qué puedes canjear los Dcredits?`,
                      value: `- Paquete de fondos de Bot (8 créditos por paquete)\n- Paquete de logos de Bot (6 créditos por paquete)\n- Paquete de stickers de Bot (5 créditos por paquete)\n- Paquete de 1 año de Bot (10 créditos por paquete)`,
                    },
                    {
                      name: `🎁┆¿Cómo canjeo los Dcredits?`,
                      value: `Para un paquete de fondos: \`/dcredits backgroundpack\`\nPara un paquete de logos: \`/dcredits logopack\`\nPara un paquete de stickers: \`/dcredits stickerpack\`\nPara un paquete de 1 año: \`/dcredits 1yearpack\``,
                    },
                    {
                      name: `🐞┆Encontré un bug en el sistema`,
                      value: `¿Algo salió mal con tus créditos? Abre un ticket en <#897213893624102965> y lo resolveremos lo antes posible`,
                    },
                  ],
                  footer: {
                    text: `© TechPoint - 2022`,
                    iconURL:
                      "https://media.discordapp.net/attachments/937337957419999272/937797574440681472/techpoint_logo-min.jpg?width=812&height=812",
                  },
                },
                interaction.channel,
              );
            });
        }
      } else {
        return client.errNormal(
          {
            text: "Solo los desarrolladores de Bot 2 pueden hacer esto",
            editreply: true,
          },
          interaction,
        );
      }
    });
  },
};
