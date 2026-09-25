const Discord = require("discord.js");
const weather = require("../../packages/weather-js/index.js");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
    const country = interaction.options.getString("location");

    weather.find(
        { search: country, degreeType: "C" },
        function (error, result) {
            if (result === undefined || result.length === 0)
                return client.errNormal(
                    {
                        error: "Ubicación **no válida**",
                        type: "editreply",
                    },
                    interaction,
                );

            var current = result[0].current;
            var location = result[0].location;

            client.embed(
                {
                    title: `☀️・Clima - ${current.skytext}`,
                    desc: `Pronóstico del clima para ${current.observationpoint}`,
                    thumbnail: current.imageUrl,
                    fields: [
                        {
                            name: "Zona horaria",
                            value: `UTC${location.timezone}`,
                            inline: true,
                        },
                        {
                            name: "Unidad",
                            value: `Celsius`,
                            inline: true,
                        },
                        {
                            name: "Temperatura",
                            value: `${current.temperature}°`,
                            inline: true,
                        },
                        {
                            name: "Viento",
                            value: `${current.winddisplay}`,
                            inline: true,
                        },
                        {
                            name: "Sensación térmica",
                            value: `${current.feelslike}°`,
                            inline: true,
                        },
                        {
                            name: "Humedad",
                            value: `${current.humidity}%`,
                            inline: true,
                        },
                    ],
                    type: "editreply",
                },
                interaction,
            );
        },
    );
};
