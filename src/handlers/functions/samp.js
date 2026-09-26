const { escapeMarkdown } = require("discord.js");
const samp = require("../../database/samp");

// Funciones comunes de los comandos /samp
module.exports = (client) => {
  client.samp = {
    // Responde con un error si la base de datos no es la del servidor de SA-MP
    async available(interaction) {
      if (await samp.isAvailable()) return true;
      client.errNormal(
        { error: "La base de datos del bot no es la del servidor de SA-MP (no hay tabla player)", type: "editreply" },
        interaction,
      );
      return false;
    },

    // Cuenta del juego vinculada a quien usa el comando, con el rango que pide la acción
    async admin(interaction, action) {
      const me = await samp.getLinkedPlayer(interaction.user.id);
      if (!me) {
        client.errNormal({ error: "Primero vincula tu cuenta del servidor con /samp link", type: "editreply" }, interaction);
        return null;
      }
      const need = samp.REQUIRED_LEVEL[action] ?? 5;
      if (me.admin_level < need) {
        client.errNormal(
          { error: `Necesitas el rango ${samp.ADMIN_LEVELS[need]} o superior en el servidor (tienes ${samp.ADMIN_LEVELS[me.admin_level] || me.admin_level})`, type: "editreply" },
          interaction,
        );
        return null;
      }
      return me;
    },

    // Jugador por nombre exacto, sin rango mayor que el de quien sanciona (como en el juego)
    async target(interaction, me) {
      const name = interaction.options.getString("name");
      const target = await samp.getPlayerByName(name);
      if (!target) {
        client.errNormal({ error: `No existe ninguna cuenta llamada ${name}`, type: "editreply" }, interaction);
        return null;
      }
      if (me && target.admin_level > me.admin_level) {
        client.errNormal({ error: "El rango administrativo de este jugador es superior al tuyo", type: "editreply" }, interaction);
        return null;
      }
      return target;
    },

    // Los nombres llevan "_" (Nombre_Apellido) y Discord lo tomaría como cursiva
    name(n) {
      return escapeMarkdown(String(n));
    },

    money(n) {
      return "$" + Number(n || 0).toLocaleString("es-ES");
    },

    hours(seconds) {
      return (Number(seconds || 0) / 3600).toLocaleString("es-ES", { maximumFractionDigits: 1 });
    },

    // Razón en una sola línea; con el aviso de baneo tiene que caber en discord_actions.reason (128)
    reason(interaction) {
      return (interaction.options.getString("reason") || "razon no especificada").replace(/[\r\n]+/g, " ").slice(0, 80);
    },
  };
};
