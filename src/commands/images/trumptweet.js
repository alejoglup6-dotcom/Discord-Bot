const fetch = require("node-fetch");

/**
 * @type {import("../../typings.d").Command}
 */
module.exports = async (client, interaction, args) => {
  let tweet = interaction.options.getString("text");

  if (tweet.length > 68) tweet = tweet.slice(0, 65) + "...";

  const res = await fetch(
    "https://nekobot.xyz/api/imagegen?type=trumptweet&text=" +
      encodeURIComponent(tweet),
  );

  const img = (await res.json()).message;

  client.embed(
    {
      title: `🖼・Tuit de Trump`,
      image: img,
      type: "editreply",
    },
    interaction,
  );
};
