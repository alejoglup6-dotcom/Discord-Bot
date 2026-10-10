const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

const ia = require("../../assets/utils/iaProviders");
const memory = require("../../assets/utils/iaMemory");
const correcciones = require("../../assets/utils/iaCorrecciones");
const feedback = require("../../assets/utils/iaFeedback");
const imagen = require("../../assets/utils/iaImagen");
const staffIa = require("../../assets/utils/iaStaff");

const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + "…" : String(s));
const ago = (ms) => (ms ? `<t:${Math.floor(ms / 1000)}:R>` : "—");

// /ia: mantenimiento de la IA del servidor. Corregir, ver huecos y estado son para el staff; "olvidar" lo puede usar cualquiera con su propio historial.
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ia")
    .setDescription("Mantenimiento de la IA del servidor")
    .addSubcommand((s) =>
      s
        .setName("corregir")
        .setDescription("Staff: enseña una respuesta correcta a la IA (tiene prioridad sobre la guía)")
        .addStringOption((o) => o.setName("pregunta").setDescription("La pregunta tal como la hacen los usuarios").setRequired(true).setMaxLength(300))
        .addStringOption((o) => o.setName("respuesta").setDescription("La respuesta correcta").setRequired(true).setMaxLength(1200)),
    )
    .addSubcommand((s) => s.setName("correcciones").setDescription("Staff: lista las correcciones guardadas"))
    .addSubcommand((s) =>
      s
        .setName("borrar")
        .setDescription("Staff: borra una corrección")
        .addIntegerOption((o) => o.setName("numero").setDescription("Número de la corrección (míralo en /ia correcciones)").setRequired(true).setMinValue(1)),
    )
    .addSubcommand((s) => s.setName("huecos").setDescription("Staff: preguntas que la IA no supo responder o respuestas marcadas con 👎"))
    .addSubcommand((s) =>
      s
        .setName("imagen")
        .setDescription("Genera una imagen original con IA (carteles, banners, logos, paisajes)")
        .addStringOption((o) => o.setName("descripcion").setDescription("Qué quieres ver (sin personas reales, marcas ni personajes existentes)").setRequired(true).setMinLength(5).setMaxLength(300))
        .addStringOption((o) =>
          o
            .setName("estilo")
            .setDescription("Estilo de la imagen")
            .setRequired(false)
            .addChoices(
              { name: "Ilustración", value: "ilustracion" },
              { name: "Realista", value: "realista" },
              { name: "Pixel art", value: "pixel" },
              { name: "Cartel / póster", value: "cartel" },
              { name: "Logo minimalista", value: "logo" },
              { name: "Anime", value: "anime" },
            ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("resumir")
        .setDescription("Staff: resume lo que pasó en este canal (solo lo ves tú)")
        .addIntegerOption((o) => o.setName("mensajes").setDescription("Cuántos mensajes leer (10-100, por defecto 50)").setRequired(false).setMinValue(10).setMaxValue(100)),
    )
    .addSubcommand((s) =>
      s
        .setName("redactar")
        .setDescription("Staff: redacta la respuesta de este ticket según tu decisión (solo la ves tú)")
        .addStringOption((o) =>
          o
            .setName("decision")
            .setDescription("Lo que TÚ decidiste; la IA solo lo pone en palabras")
            .setRequired(true)
            .addChoices({ name: "Aceptada", value: "aceptada" }, { name: "Rechazada", value: "rechazada" }, { name: "Faltan datos / más información", value: "info" }),
        )
        .addStringOption((o) => o.setName("motivo").setDescription("Motivo o detalles que quieres que incluya (si no, no inventa uno)").setRequired(false).setMaxLength(500)),
    )
    .addSubcommand((s) => s.setName("estado").setDescription("Staff: estado de los proveedores de IA"))
    .addSubcommand((s) =>
      s
        .setName("olvidar")
        .setDescription("Borra el historial de conversación de la IA con un usuario (por defecto el tuyo)")
        .addUserOption((o) => o.setName("usuario").setDescription("Solo el staff puede borrar el de otra persona").setRequired(false)),
    ),

  run: async (client, interaction, args) => {
    const sub = interaction.options.getSubcommand();
    // resumir y redactar son para el staff y nunca se publican en el canal
    await interaction.deferReply({ withResponse: true, ...(sub === "resumir" || sub === "redactar" ? { flags: MessageFlags.Ephemeral } : {}) });
    const guild = interaction.guild;
    const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) || interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
    const show = (title, desc, fields) => client.embed({ title, desc, fields, type: "editreply" }, interaction);
    const deny = () => client.errNormal({ error: "Este subcomando es solo para el staff", type: "editreply" }, interaction);

    if (sub === "olvidar") {
      const target = interaction.options.getUser("usuario") || interaction.user;
      if (target.id !== interaction.user.id && !isStaff) return deny();
      const n = await memory.clearUser(guild.id, target.id);
      return show("🧹・Historial borrado", `Borré ${n} mensaje(s) del historial de la IA con <@${target.id}>.`);
    }

    if (sub === "imagen") {
      const description = interaction.options.getString("descripcion");
      const out = await imagen.generate({
        userId: interaction.user.id,
        isStaff,
        description,
        style: interaction.options.getString("estilo") || "ilustracion",
        onStage: (stage) => interaction.editReply({ content: stage === "revisando" ? "🔎 Revisando tu descripción…" : "🎨 Dibujando, puede tardar hasta un minuto…" }).catch(() => {}),
      });
      if (!out.ok) return client.errNormal({ error: out.reason, type: "editreply" }, interaction);
      const name = `ia-${Date.now()}.${out.mime === "image/png" ? "png" : out.mime === "image/webp" ? "webp" : "jpg"}`;
      const embed = new EmbedBuilder()
        .setDescription(clip(description, 300))
        .setImage(`attachment://${name}`)
        .setFooter({ text: `🤖 Generada por IA · pedida por ${interaction.user.username}` });
      return interaction.editReply({ content: "", embeds: [embed], files: [new AttachmentBuilder(out.buffer, { name })] });
    }

    if (!isStaff) return deny();

    if (sub === "resumir") {
      const out = await staffIa.summarize(client, interaction, interaction.options.getInteger("mensajes") || 50);
      if (!out.ok) return interaction.editReply({ content: out.reason });
      const embed = new EmbedBuilder()
        .setTitle("RESUMEN IA · SOLO STAFF")
        .addFields(out.fields)
        .setFooter({ text: `🤖 Generado por una IA, revísalo antes de usarlo. No decide nada. · ${out.messages} mensajes leídos` });
      if (out.legend) embed.setDescription(`**Quién es quién** (la IA no ve los nombres)\n${out.legend}`.slice(0, 1000));
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === "redactar") {
      const out = await staffIa.draft(client, interaction, { decision: interaction.options.getString("decision"), motivo: interaction.options.getString("motivo") || "" });
      if (!out.ok) return interaction.editReply({ content: out.reason });
      const embed = new EmbedBuilder()
        .setTitle(`BORRADOR · TICKET #${String(out.ticket).padStart(4, "0")}`)
        .setDescription(out.text)
        .setFooter({ text: "🤖 Borrador de una IA con TU decisión: edítalo y envíalo tú. Nada se ha enviado ni aplicado." });
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === "corregir") {
      const question = interaction.options.getString("pregunta");
      const answer = interaction.options.getString("respuesta");
      if (!correcciones._internals.stems(question).size)
        return client.errNormal({ error: "La pregunta necesita al menos una palabra clave (no solo palabras muy comunes)", type: "editreply" }, interaction);
      const num = await correcciones.add(guild.id, { question, answer, by: interaction.user.id, byName: interaction.user.tag || interaction.user.username });
      return show("✅・Corrección guardada", `**#${num}**\n**Pregunta:** ${clip(question, 300)}\n**Respuesta:** ${clip(answer, 800)}\n\nLa IA la usará desde ya, por encima de la guía.`);
    }

    if (sub === "correcciones") {
      const rows = await correcciones.list(guild.id);
      if (!rows.length) return show("📝・Correcciones", "Todavía no hay correcciones. Crea una con `/ia corregir`.");
      const lines = rows.slice(0, 15).map((r) => `**#${r.Num}** ${clip(r.Question, 90)}\n└ ${clip(r.Answer, 140)}`);
      return show("📝・Correcciones", `${lines.join("\n")}${rows.length > 15 ? `\n\n…y ${rows.length - 15} más` : ""}`);
    }

    if (sub === "borrar") {
      const n = await correcciones.remove(guild.id, interaction.options.getInteger("numero"));
      if (!n) return client.errNormal({ error: "No existe una corrección con ese número", type: "editreply" }, interaction);
      return show("🗑️・Corrección borrada", "Listo, la IA ya no la usará.");
    }

    if (sub === "huecos") {
      const rows = await correcciones.topGaps(guild.id, 10);
      if (!rows.length) return show("🕳️・Huecos de conocimiento", "No hay huecos registrados. 🎉");
      const lines = rows.map(
        (r) => `${r.Kind === "mala-respuesta" ? "👎" : "❓"} **×${r.Count || 1}** ${clip(r.Question, 120)} · ${ago(r.At)}`,
      );
      return show(
        "🕳️・Huecos de conocimiento",
        `${lines.join("\n")}\n\n❓ = la guía no tenía nada · 👎 = respuesta marcada como mala\nArregla uno con \`/ia corregir\` (se quita de la lista) o agregándolo a la guía.`,
      );
    }

    if (sub === "estado") {
      const st = ia.status();
      const lines = st.map((p) => {
        const flag = !p.hasKey ? "⚪ sin key" : p.paused ? `🟠 en pausa` : "🟢 activo";
        const out = p.modelsOut.length ? ` · ${p.modelsOut.length} modelo(s) en pausa` : "";
        return `${flag} **${p.name}**${p.vision ? " 👁️" : ""} — ✔ ${p.ok} / ✖ ${p.fail}${out}${p.last ? `\n└ último error: ${clip(p.last, 90)}` : ""}`;
      });
      const fb = feedback.counters;
      const em = require("../../assets/utils/iaEmbeddings").status();
      const emLine = !em.enabled ? "⚪ Búsqueda semántica apagada" : em.indexing ? `🟠 Búsqueda semántica indexando… (${em.indexed})` : em.error ? `🔴 Búsqueda semántica con error: ${clip(em.error, 90)}` : `🟢 Búsqueda semántica: ${em.indexed} secciones`;
      return show("🤖・Estado de la IA", `${lines.join("\n")}\n\n${emLine}\n👁️ = tiene modelos que leen imágenes\n👍 ${fb.up} · 👎 ${fb.down} (desde el último reinicio)`);
    }
  },
};
