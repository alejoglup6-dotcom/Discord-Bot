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

    // Aviso por MD a un usuario de Discord. true = enviado (false si tiene los MD cerrados)
    async warnUnlinked(userId, detail) {
      const user = await client.users.fetch(userId).catch(() => null);
      if (!user) return false;
      const sent = await user
        .send({
          embeds: [
            {
              title: "⚠️・Cuenta sin vincular",
              description:
                `${detail}\n\nVincúlala con \`/samp link\` (o \`!vincular\`) y el código que te da lo escribes en el juego ` +
                "con `/vincular`. Si ya pagaste algo, avisa al staff.",
              color: 0xfee75c,
            },
          ],
        })
        .catch(() => null);
      return Boolean(sent);
    },

    // Jugador por nombre exacto o por @ (usuario de Discord con la cuenta vinculada), sin rango mayor que el de
    // quien sanciona (como en el juego). Con opts.warnUnlinked ("/juego <sub>") avisa por MD a quien no está vinculado.
    async target(interaction, me, opts = {}) {
      const raw = String(interaction.options.getString("name") || "").trim();
      let discordId = interaction.options.getUser?.("usuario")?.id || null;
      if (!discordId) discordId = (raw.match(/^<@!?(\d{15,21})>$/) || raw.match(/^(\d{17,21})$/))?.[1] || null;

      let target;
      if (discordId) {
        target = await samp.getLinkedPlayer(discordId);
        if (!target) {
          let extra = "";
          if (opts.warnUnlinked) {
            const sent = await client.samp.warnUnlinked(
              discordId,
              `Intentaron aplicarte \`/juego ${opts.warnUnlinked}\`, pero tu cuenta del servidor **no está vinculada** a Discord.`,
            );
            extra = sent ? ". Le avisé por MD" : ". No pude avisarle por MD (los tiene cerrados)";
          }
          client.errNormal({ error: `<@${discordId}> no tiene la cuenta del servidor vinculada${extra}`, type: "editreply" }, interaction);
          return null;
        }
      } else if (!raw) {
        client.errNormal({ error: "Indica el jugador: su nombre (Nombre_Apellido) o su @ de Discord", type: "editreply" }, interaction);
        return null;
      } else {
        target = await samp.getPlayerByName(raw);
        if (!target) {
          client.errNormal({ error: `No existe ninguna cuenta llamada ${raw}`, type: "editreply" }, interaction);
          return null;
        }
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
