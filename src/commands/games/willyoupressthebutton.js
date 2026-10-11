const Discord = require("discord.js");
const { truncate } = require("fs/promises");
const { decode } = require("html-entities");

const DILEMAS = [
  ["Ganas un millón de dólares", "solo puedes gastarlo en comida rápida"],
  ["Puedes volar", "solo a 1 metro del suelo"],
  ["Te vuelves invisible cuando quieras", "tu ropa no se vuelve invisible"],
  ["Nunca más tienes que dormir", "siempre tienes un poco de sueño"],
  ["Sabes todos los idiomas del mundo", "olvidas tu idioma natal"],
  ["Tienes un auto deportivo gratis", "solo puede ir a 30 km/h"],
  ["Puedes leer la mente", "todos pueden leer la tuya"],
  ["Viajas en el tiempo cuando quieras", "no puedes volver al presente"],
  ["Comes lo que quieras sin engordar", "todo te sabe a brócoli"],
  ["Eres el mejor jugador del servidor", "nadie te cree"],
  ["Tienes internet gratis para siempre", "solo a 1 MB/s"],
  ["Ganas cualquier discusión", "nadie quiere hablar contigo"],
  ["Puedes teletransportarte", "llegas siempre 10 minutos tarde"],
  ["Tienes una mansión", "está en medio del desierto"],
  ["Nunca te vuelves a enfermar", "estornudas cada 5 minutos"],
  ["Recibes $100 cada día", "pierdes un calcetín cada día"],
  ["Puedes hablar con los animales", "solo te contestan las palomas"],
  ["Eres famoso en todo el mundo", "por un video vergonzoso"],
  ["Tu celular nunca se queda sin batería", "la pantalla siempre está al 10% de brillo"],
  ["Puedes respirar bajo el agua", "solo en agua fría"],
  ["Tienes 10 años más de vida", "pierdes el sentido del gusto"],
  ["Vives en SampCity de verdad", "eres policía y te persiguen todos"],
  ["Ganas la lotería", "tienes que regalar la mitad a un desconocido"],
  ["Nunca más haces fila", "siempre pierdes en piedra, papel o tijera"],
  ["Tienes un superpoder", "te lo eligen al azar cada mañana"],
];
const VOTOS = new Map();
function votar(idx, si) {
  const v = VOTOS.get(idx) || { si: 0, no: 0 };
  if (si) v.si++; else v.no++;
  VOTOS.set(idx, v);
}
function porcentajes(idx) {
  const v = VOTOS.get(idx) || { si: 0, no: 0 };
  const t = v.si + v.no;
  if (!t) return { yes: "—", no: "—" };
  const si = Math.round((v.si / t) * 100);
  return { yes: `${si}% · ${v.si}`, no: `${100 - si}% · ${v.no}` };
}

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  const getRandomString = (length) => {
    const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += randomChars.charAt(
        Math.floor(Math.random() * randomChars.length),
      );
    }
    return result;
  };

  const id1 =
    getRandomString(20) +
    "-" +
    getRandomString(20) +
    "-" +
    getRandomString(20) +
    "-" +
    getRandomString(20);
  const id2 =
    getRandomString(20) +
    "-" +
    getRandomString(20) +
    "-" +
    getRandomString(20) +
    "-" +
    getRandomString(20);

  // La API de antes (willyoupressthebutton.com) ya no funciona (526): los dilemas estan aqui y los porcentajes salen de
  // los votos de este servidor (en memoria, se reinician con el bot).
  const idx = Math.floor(Math.random() * DILEMAS.length);
  Promise.resolve({ dilemma: { txt1: DILEMAS[idx][0], txt2: DILEMAS[idx][1], ...porcentajes(idx) } })
    .then((data) => {
      const res = {
        questions: [data.dilemma.txt1, data.dilemma.txt2],
        percentage: {
          1: data.dilemma.yes,
          2: data.dilemma.no,
        },
      };

      let btn = new Discord.ButtonBuilder()
        .setStyle(Discord.ButtonStyle.Success)
        .setLabel("Sí")
        .setCustomId(id1);
      let btn2 = new Discord.ButtonBuilder()
        .setStyle(Discord.ButtonStyle.Danger)
        .setLabel("No")
        .setCustomId(id2);

      let row = new Discord.ActionRowBuilder().addComponents(btn, btn2);

      client
        .embed(
          {
            title: `🤔・¿Pulsarías el botón?`,
            desc: `\`\`\`${decode(res.questions[0].charAt(0).toUpperCase() + res.questions[0].slice(1))} \`\`\`\n**Pero** \`\`\`\n\n${decode(res.questions[1].charAt(0).toUpperCase() + res.questions[1].slice(1))}\`\`\``,
            components: [row],
            type: "editreply",
          },
          interaction,
        )
        .then(async (m) => {
          const collector = interaction.channel.createMessageComponentCollector(
            {
              componentType: Discord.ComponentType.Button,
              filter: (i) => (!m || i.message.id === m.id) && i.user.id === interaction.user.id,
              time: 120000,
            },
          );

          collector.on("collect", (btn) => {
            if (btn.user.id !== interaction.user.id) return;

            btn.deferUpdate();
            votar(idx, btn.customId === id1);
            const p = porcentajes(idx);
            res.percentage["1"] = p.yes;
            res.percentage["2"] = p.no;
            if (btn.customId === id1) {
              btn = new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Success)
                .setLabel(`Sí (${res.percentage["1"]})`)
                .setCustomId(id1)
                .setDisabled(true);
              btn2 = new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Danger)
                .setLabel(`No (${res.percentage["2"]})`)
                .setCustomId(id2)
                .setDisabled(true);
              collector.stop();

              client.embed(
                {
                  title: `🤔・¿Pulsarías el botón?`,
                  desc: `\`\`\`${decode(res.questions[0].charAt(0).toUpperCase() + res.questions[0].slice(1))} \`\`\`\n**Pero** \`\`\`\n\n${decode(res.questions[1].charAt(0).toUpperCase() + res.questions[1].slice(1))}\`\`\``,
                  components: [{ type: 1, components: [btn, btn2] }],
                  type: "editreply",
                },
                interaction,
              );
            } else if (btn.customId === id2) {
              btn = new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Danger)
                .setLabel(`Sí (${res.percentage["1"]})`)
                .setCustomId(id1)
                .setDisabled(true);
              btn2 = new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Success)
                .setLabel(`No (${res.percentage["2"]})`)
                .setCustomId(id2)
                .setDisabled(true);
              collector.stop();

              client.embed(
                {
                  title: `🤔・¿Pulsarías el botón?`,
                  desc: `\`\`\`${decode(res.questions[0].charAt(0).toUpperCase() + res.questions[0].slice(1))} \`\`\`\n**Pero** \`\`\`\n\n${decode(res.questions[1].charAt(0).toUpperCase() + res.questions[1].slice(1))}\`\`\``,
                  components: [{ type: 1, components: [btn, btn2] }],
                  type: "editreply",
                },
                interaction,
              );
            }
          });
        });
    });
};
