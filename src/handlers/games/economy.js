const Schema = require("../../database/models/economy");

module.exports = async (client) => {
  // Suma efectivo a la cartera de Fortuna con una operación atómica (la usan los juegos guessNumber y guessWord).
  client.addMoney = async function (interaction, user, amount) {
    amount = Number(amount);
    if (!Number.isFinite(amount) || amount === 0) return;
    return Schema.findOneAndUpdate(
      { Guild: interaction.guild.id, User: user.id },
      { $inc: { Money: amount }, $setOnInsert: { Bank: 0 } },
      { upsert: true, new: true },
    ).catch((e) => console.error("[economy] addMoney:", e.message));
  };
};
