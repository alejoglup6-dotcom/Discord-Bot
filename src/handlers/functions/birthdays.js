const Schema = require("../../database/models/birthday");
const Devs = require("../../database/models/developers");
const birthdayChannel = require("../../database/models/birthdaychannels");

module.exports = (client) => {
  const checkBirthdays = async () => {
    const now = new Date();
    const getLastDate = await Devs.findOne({ Action: "Birthday" }).exec();

    let month = now.getMonth() + 1;
    let day = now.getDate();

    let dateNow = `${day} - ${month}`;

    if (getLastDate) {
      const lastDate = getLastDate.Date;

      if (lastDate == dateNow) return;

      getLastDate.Date = dateNow;
      getLastDate.save();
    } else {
      new Devs({
        Action: "Birthday",
        Date: dateNow,
      }).save();
    }

    const months = {
      1: "enero",
      2: "febrero",
      3: "marzo",
      4: "abril",
      5: "mayo",
      6: "junio",
      7: "julio",
      8: "agosto",
      9: "septiembre",
      10: "octubre",
      11: "noviembre",
      12: "diciembre",
    };

    const convertedDay = suffixes(day);
    const convertedMonth = months[month];
    const birthdayString = `${convertedDay} de ${convertedMonth}`;

    const results = await Schema.find({ Birthday: birthdayString });

    if (results) {
      for (const result of results) {
        const { Guild, User } = result;

        const finalGuild = client.guilds.cache.get(Guild);
        if (finalGuild) {
          birthdayChannel
            .findOne({ Guild: finalGuild.id })
            .then(async (data) => {
              if (data) {
                const channel = finalGuild.channels.cache.get(data.Channel);

                client.embed(
                  {
                    title: `${client.emotes.normal.birthday}・Cumpleaños`,
                    desc: `¡Feliz cumpleaños, <@!${User}>!`,
                  },
                  channel,
                );
              }
            });
        }
      }
    }

    setTimeout(checkBirthdays, 1000 * 10);
  };

  checkBirthdays();
};

function suffixes(number) {
  const converted = number.toString();

  return converted;
}
