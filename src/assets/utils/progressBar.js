// Barra de progreso de la canción actual: "00:01:23 ┃ ▬▬▬🔘▬▬▬▬▬▬ ┃ 00:03:45"
function formatTime(ms) {
  return new Date(ms).toISOString().slice(11, 19);
}

module.exports = (track, position, size = 10) => {
  if (!track || track.isStream || !track.length) return "🔴 EN VIVO";

  const current = Math.min(Math.max(position || 0, 0), track.length);
  const progress = Math.min(Math.round((current / track.length) * size), size - 1);
  const bar = "▬".repeat(progress) + "🔘" + "▬".repeat(size - progress - 1);

  return `${formatTime(current)} ┃ ${bar} ┃ ${formatTime(track.length)}`;
};
