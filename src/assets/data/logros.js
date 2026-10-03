/*
 * Logros del servidor de juego, para el canal 🎖️┆logros. Es una copia de la tabla LOGROS de
 * gamemodes/src/logros.pwn (repo Backup): si allí cambia un logro o su premio, hay que cambiarlo aquí y volver a
 * publicar el canal (infoEmbeds.logrosEmbeds).
 */
module.exports = {
  // [nombre, descripción, premio, puntos, se anuncia a todo el servidor]
  GROUPS: [
    { title: "⭐ Nivel", items: [
      ["Primeros pasos", "Llega a nivel 2", 2000, 5, false],
      ["Vecino", "Llega a nivel 5", 5000, 10, false],
      ["Ciudadano", "Llega a nivel 10", 15000, 20, true],
      ["Veterano", "Llega a nivel 20", 40000, 40, true],
      ["Leyenda", "Llega a nivel 30", 100000, 80, true],
    ] },
    { title: "⏱️ Horas jugadas", items: [
      ["Recién llegado", "Juega 5 horas", 3000, 5, false],
      ["Habitual", "Juega 25 horas", 8000, 10, false],
      ["Constante", "Juega 100 horas", 25000, 25, true],
      ["Vida en la ciudad", "Juega 300 horas", 75000, 60, true],
    ] },
    { title: "🛠️ Trabajos", items: [
      ["Trabajador", "Suma 50 de experiencia en trabajos", 5000, 5, false],
      ["Currante", "Suma 250 de experiencia en trabajos", 15000, 15, false],
      ["Profesional", "Suma 1000 de experiencia en trabajos", 50000, 40, true],
    ] },
    { title: "🏠 Propiedades y vehículos", items: [
      ["Propietario", "Compra una propiedad", 10000, 15, false],
      ["Al volante", "Ten un vehículo propio", 5000, 10, false],
      ["Coleccionista", "Ten 3 vehículos propios", 20000, 20, false],
    ] },
    { title: "🏦 Dinero en el banco", items: [
      ["Ahorrador", "Ten $100.000 en el banco", 5000, 10, false],
      ["Millonario", "Ten $1.000.000 en el banco", 25000, 40, true],
    ] },
    { title: "🚔 Policía y bandas", items: [
      ["En la banda", "Únete a una banda", 3000, 5, false],
      ["Agente de la ley", "Haz 10 arrestos como policía", 10000, 15, false],
      ["Sheriff", "Haz 100 arrestos como policía", 50000, 40, true],
    ] },
    { title: "📅 Calendario", items: [
      ["Constancia", "Completa una temporada del calendario diario", 10000, 20, false],
    ] },
  ],
};
