const fetch = require("node-fetch");
const generator = require("generate-password");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const password = generator.generate({
    length: 10,
    symbols: true,
    numbers: true,
  });

  const user = interaction.options.getUser("user");

  if (!user)
    return client.errUsage(
      { usage: "hack [mencionar usuario]", type: "editreply" },
      interaction,
    );

  function wait(ms) {
    let start = new Date().getTime();
    let end = start;
    while (end < start + ms) {
      end = new Date().getTime();
    }
  }

  client
    .embed(
      {
        title: "💻・Hackeando",
        desc: `Empezó el hackeo a ${user}...`,
        type: "editreply",
      },
      interaction,
    )
    .then((msg) => {
      wait(140);
      client
        .embed(
          {
            title: "💻・Hackeando",
            desc: `Buscando información del usuario..`,
            type: "edit",
          },
          msg,
        )
        .then((i) => {
          wait(133);
          client
            .embed(
              {
                title: "💻・Hackeando",
                desc: `Buscando la dirección IP...`,
                type: "edit",
              },
              msg,
            )
            .then((i) => {
              wait(140);
              client
                .embed(
                  {
                    title: "💻・Hackeando",
                    desc: `¡Se encontró la dirección IP del usuario!`,
                    fields: [
                      {
                        name: "🔗┆Dirección IP",
                        value: `\`\`\`127.0.0.1\`\`\``,
                        inline: true,
                      },
                    ],
                    type: "edit",
                  },
                  msg,
                )
                .then((i) => {
                  wait(60);
                  client
                    .embed(
                      {
                        title: "💻・Hackeando",
                        desc: `Buscando el inicio de sesión de Discord...`,
                        type: "edit",
                      },
                      msg,
                    )
                    .then((i) => {
                      wait(230);
                      client
                        .embed(
                          {
                            title: "💻・Hackeando",
                            desc: `¡Se encontró el inicio de sesión de Discord del usuario!`,
                            fields: [
                              {
                                name: "📨┆Correo",
                                value: `\`\`\`${user.username}onDiscord@gmail.com\`\`\``,
                              },
                              {
                                name: "🔑┆Contraseña",
                                value: `\`\`\`${password}\`\`\``,
                              },
                            ],
                            type: "edit",
                          },
                          msg,
                        )
                        .then((i) => {
                          wait(200);
                          client
                            .embed(
                              {
                                title: "💻・Hackeando",
                                desc: `Buscando el token de Discord...`,
                                type: "edit",
                              },
                              msg,
                            )
                            .then((i) => {
                              wait(200);
                              fetch(
                                `https://some-random-api.com/bottoken?${user.id}`,
                              )
                                .then((res) => res.json())
                                .catch({})
                                .then(async (json) => {
                                  client
                                    .embed(
                                      {
                                        title: "💻・Hackeando",
                                        desc: `¡Se encontró el token de la cuenta de Discord del usuario!`,
                                        fields: [
                                          {
                                            name: "🔧┆Token",
                                            value: `\`\`\`${json.token}\`\`\``,
                                            inline: true,
                                          },
                                        ],
                                        type: "edit",
                                      },
                                      msg,
                                    )
                                    .then((i) => {
                                      wait(140);
                                      client
                                        .embed(
                                          {
                                            title: "💻・Hackeando",
                                            desc: `Denunciando la cuenta a Discord por romper los TOS...`,
                                            type: "edit",
                                          },
                                          msg,
                                        )
                                        .then((i) => {
                                          wait(180);
                                          client.succNormal(
                                            {
                                              text: `${user} fue hackeado con éxito. Toda la información del usuario se envió a tus MD`,
                                              type: "edit",
                                            },
                                            msg,
                                          );
                                          client.embed(
                                            {
                                              title: "😂・Era una broma",
                                              image:
                                                "https://media1.tenor.com/images/05006ed09075a0d6965383797c3cea00/tenor.gif?itemid=17987788",
                                            },
                                            interaction.user,
                                          );
                                        });
                                    });
                                })
                                .catch({});
                            });
                        });
                    });
                });
            });
        });
    });
};
