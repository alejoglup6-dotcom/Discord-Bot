/*
 * Mensajes fijos de los canales de EMPIEZA AQUÍ (los publica /reorganizar aplicar). Estilo de la marca
 * (src/assets/utils/brand.js): títulos en mayúsculas con barra, rojo y rosa, sin "┆".
 * ch = Map clave del plano (src/assets/data/serverLayout.js) -> canal, para enlazar canales.
 */
const Discord = require("discord.js");
const { brandEmbed, webButton, COLORS, WEB, SERVER_IP } = require("./brand");
const verification = require("./verification");
const tickets = require("./ticketsPro");

const link = (ch, key, fallback) => (ch.get(key) ? `${ch.get(key)}` : fallback);

function rules(guild, ch) {
  const intro = brandEmbed(guild, {
    title: "NORMAS DE SAMPCITY",
    desc:
      "SampCity es una ciudad de rol: aquí todos venimos a pasarlo bien y a contar buenas historias. Estas normas valen en el " +
      "Discord, en el servidor de juego y en la web. No conocerlas no libra de cumplirlas.\n\n" +
      "Si ves a alguien saltárselas, **no respondas igual**: abre un ticket en " + link(ch, "soporte", "el canal de soporte") + " con pruebas.",
  });
  const sections = [
    [
      "1 · TRATO ENTRE PERSONAS",
      "• Nada de insultos, acoso, amenazas ni burlas por origen, género, religión u orientación.\n" +
        "• Las discusiones del rol se quedan en el rol: fuera del personaje se habla con respeto.\n" +
        "• Prohibido compartir datos personales de otros (fotos, nombres reales, direcciones…).",
    ],
    [
      "2 · LO QUE SE PUBLICA",
      "• Sin contenido sexual, gore ni nada ilegal, tampoco en avatares o apodos.\n" +
        "• Cada canal tiene su tema: memes en memes, capturas en capturas.\n" +
        "• Sin spam, cadenas, flood de emojis ni menciones masivas.\n" +
        "• Publicidad de otros servidores solo por " + link(ch, "alianzas", "alianzas") + " y con el visto bueno del staff.",
    ],
    [
      "3 · TU CUENTA",
      "• Para ver el Discord tu cuenta tiene que estar vinculada con la del juego (" + link(ch, "verificacion", "verificación") + ").\n" +
        "• Tu apodo es el de tu personaje y no se cambia.\n" +
        "• Una persona, una cuenta. Las multicuentas, la compra-venta de cuentas y compartirlas se sancionan.\n" +
        "• Eres responsable de lo que se haga con tu cuenta: no des tu contraseña a nadie, ni al staff.",
    ],
    [
      "4 · DENTRO DEL JUEGO",
      "• Interpreta a tu personaje como una persona real: valora tu vida y la de los demás.\n" +
        "• Nada de matar sin motivo de rol, usar información de fuera del juego en el rol ni forzar acciones imposibles.\n" +
        "• Prohibidos los hacks, mods que den ventaja, bugs aprovechados a propósito y macros.\n" +
        "• Las facciones y bandas siguen además sus propias normas internas.",
    ],
    [
      "5 · SANCIONES",
      "• Hay **advertencias** (1, 2 y 3; cada una dura 30 días), **silencio**, **jail** administrativo y **ban** temporal o permanente.\n" +
        "• Las sanciones se ven en tus roles de Discord y en el juego.\n" +
        "• Según la gravedad el staff puede saltarse pasos.\n" +
        "• ¿Crees que una sanción es injusta? Abre un ticket de **Apelar una sanción**; discutirla en los canales públicos empeora la sanción.",
    ],
    [
      "6 · EL STAFF",
      "• El staff está para ayudar: trátalo como te gustaría que te trataran.\n" +
        "• Nadie del staff te pedirá nunca tu contraseña ni pagos fuera de la tienda oficial.\n" +
        "• Las decisiones se revisan por ticket, no por mensaje privado.",
    ],
  ];
  const body = sections.map(([title, desc], i) =>
    brandEmbed(guild, { title, desc, color: i % 2 ? COLORS.pink : COLORS.red }),
  );
  const outro = brandEmbed(guild, {
    color: COLORS.dark,
    desc: "Al quedarte en el servidor aceptas estas normas. El staff puede actualizarlas; los cambios se avisan en " + link(ch, "anuncios", "anuncios") + ".",
  });
  return [{ embeds: [intro, ...body.slice(0, 3)] }, { embeds: [...body.slice(3), outro] }];
}

function guide(guild, ch) {
  const embed = brandEmbed(guild, {
    title: "PRIMEROS PASOS EN LA CIUDAD",
    desc: "Todo lo que necesitas para empezar, en orden:",
    fields: [
      { name: "1 · Crea tu cuenta en el juego", value: `Descarga el cliente (${link(ch, "descargas", "canal de descargas")}) y entra a **${SERVER_IP()}**. Al entrar por primera vez creas tu personaje con nombre y apellido.` },
      { name: "2 · Verifícate", value: `En ${link(ch, "verificacion", "verificación")} unes tu Discord a tu cuenta desde la web. Así se abren todos los canales y tu apodo pasa a ser el de tu personaje.` },
      { name: "3 · Lee las normas", value: `Están en ${link(ch, "normas", "normas")}. Son cortas y te ahorran sanciones.` },
      { name: "4 · Aprende lo básico", value: `Dentro del juego usa **/comandos**. Aquí tienes ${link(ch, "comandos", "los comandos")}, ${link(ch, "trabajos", "los trabajos")} y ${link(ch, "faq", "las preguntas frecuentes")}.` },
      { name: "5 · ¿Atascado?", value: `Abre un ticket en ${link(ch, "soporte", "soporte")} y el staff te ayuda.` },
    ],
  });
  const row = new Discord.ActionRowBuilder().addComponents(webButton("Web de SampCity", "/", "🌐"), webButton("Verificarme", "/verificar", "🔐"));
  return [{ embeds: [embed], components: [row] }];
}

// Mensajes de cada "post" del plano
function build(post, guild, ch) {
  if (post === "rules") return rules(guild, ch);
  if (post === "guide") return guide(guild, ch);
  if (post === "verify") return [verification.panel(guild)];
  if (post === "tickets") return [tickets.panel(guild)];
  return [];
}

module.exports = { build, rules, guide, WEB };
