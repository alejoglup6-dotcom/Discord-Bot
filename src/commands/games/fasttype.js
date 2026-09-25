const Discord = require("discord.js");
const ms = require("ms");

let timeLength = 50000;
module.exports = async (client, interaction, args) => {
  let list = `Como estábamos perdidos, tuvimos que volver por donde vinimos.
    Está en una banda de chicos, lo cual no tiene mucho sentido para una serpiente.
    Un pato muerto no vuela hacia atrás.
    No ensucies mi jardín y me digas que intentas ayudar a mis plantas a crecer.
    Su grito silenció a los adolescentes escandalosos.
    Era difícil distinguir a los miembros del equipo porque todos llevaban coleta.
    Me han dicho que Nancy es muy guapa.
    En las colonias nudistas no se lleva la moda de la hoja de parra.
    Una canción puede alegrar o arruinar el día de alguien si se lo permite.
    No vio ninguna ironía en pedirme que cambiara pero querer que la aceptara tal como es.
    El pasatiempo favorito de mi tío era construir coches con fideos.
    Al final, se dio cuenta de que podía ver sonidos y oír palabras.
    Por favor, busca en internet una receta de sopa de pollo.
    Gary no tardó en darse cuenta de que los ladrones eran unos aficionados.
    ¿Cómo te hiciste daño?
    Era obvio que tenía calor, estaba sudada y cansada.
    Parecía confusamente perplejo.
    El amor no es como la pizza.
    Siempre era peligroso conducir con él porque insistía en que los conos eran una pista de slalom.
    Mientras esperaba a que la ducha se calentara, notó que podía oír cómo cambiaba la temperatura del agua.
    Saludos desde la galaxia MACS0647-JD, o lo que llamamos hogar.
    El mundo ha cambiado mucho en los últimos diez años.
    Al entrar en la iglesia oyó la voz suave de alguien susurrando al teléfono.
    Ahora necesito reflexionar sobre mi existencia y preguntarme si de verdad soy real
    El clima de ayer era bueno para escalar.
    Los waffles siempre están mejor sin hormigas de fuego ni pulgas.
    Nancy estaba orgullosa de dirigir un naufragio bien organizado.
    Estaba tan ocupado pensando si podía hacerlo que no se detuvo a pensar si debía.
    Si comer tortillas de tres huevos engorda, los huevos de periquito son un buen sustituto.
    No respeto a nadie que no sepa distinguir entre Pepsi y Coca-Cola.
    Encontró el final del arcoíris y se sorprendió con lo que había allí.
    Se preguntaba por qué a los 18 tenía edad para ir a la guerra, pero no para comprar cigarros.
    Vivía en la calle Selva de los Monos y eso parecía explicar todas sus rarezas.
    Julie quiere un marido perfecto.
    ¿Te traigo algo de beber?
    Por favor, espera fuera de la casa.
    Su hijo bromeó con que las barritas energéticas no eran más que golosinas para adultos.
    Mi hermana mayor se parece a mi mamá.
    El follaje espeso y las enredaderas hicieron que la caminata fuera casi imposible.
    Una gema reluciente no es suficiente.
    Treinta años después, seguía pensando que estaba bien poner el papel higiénico por debajo y no por encima.
    Cada persona que te conoce tiene una percepción diferente de quién eres.
    Baja las escaleras con cuidado.
    Enfrentándose a su mayor miedo, se comió su primer malvavisco.
    Lloraba diamantes.
    Mañana traerá algo nuevo, así que deja el hoy como un recuerdo.
    Erin creó sin querer un nuevo universo.
    David prefiere meter la tienda de campaña a presión en la bolsa en lugar de doblarla bien.
    A la mesera no le hizo gracia cuando pidió huevos verdes con jamón.
    Lo único que tienes que hacer es tomar el bolígrafo y empezar.`;

  async function start() {
    const inGame = new Set();
    const filter = (m) => m.author.id === interaction.user.id;
    if (inGame.has(interaction.user.id)) return;
    inGame.add(interaction.user.id);
    var i;
    for (i = 0; i < 25; i++) {
      const time = Date.now();

      list = list.split("\n");
      let sentenceList = list[Math.floor(Math.random() * list.length)];

      let sentence = "";
      let ogSentence = sentenceList.toLowerCase().replace("    ", "");

      ogSentence.split(" ").forEach((argument) => {
        sentence += "`" + argument.split("").join(" ") + "` ";
      });

      await client.embed(
        {
          title: `💬・Escritura rápida`,
          desc: `¡Escribe lo siguiente en ${ms(timeLength, { long: true })}! \n${sentence}`,
          type: "editreply",
        },
        interaction,
      );

      try {
        var msg = await interaction.channel.awaitMessages({
          filter,
          max: 1,
          time: timeLength,
          errors: ["time"],
        });
      } catch (ex) {
        client.errNormal(
          {
            error: "¡Se acabó el tiempo!",
            type: "editreply",
          },
          interaction,
        );
        inGame.delete(interaction.user.id);
        break;
      }

      if (
        ["cancel", "end"].includes(msg.first().content.toLowerCase().trim())
      ) {
        msg.first().delete();
        client.succNormal(
          {
            text: "¡Terminado!",
            type: "editreply",
          },
          interaction,
        );
        inGame.delete(interaction.user.id);
        break;
      } else if (
        msg.first().content.toLowerCase().trim() === ogSentence.toLowerCase()
      ) {
        msg.first().delete();
        client.succNormal(
          {
            text: `¡Lo lograste en ${ms(Date.now() - time, { long: true })}!`,
            type: "editreply",
          },
          interaction,
        );
        inGame.delete(interaction.user.id);
        break;
      } else {
        client.errNormal(
          {
            error: "¡Por desgracia no lo lograste!",
            type: "editreply",
          },
          interaction,
        );
        inGame.delete(interaction.user.id);
        break;
      }
    }
  }

  start();
};
