/*
 * Recompensas por invitar gente al servidor de Discord. El dinero es el de la Fortuna / economía del bot
 * (no el del juego). Los roles se buscan por su nombre en el servidor.
 */
module.exports = {
  // Pago por cada persona invitada que entra (una sola vez por persona, aunque salga y vuelva a entrar)
  PER_INVITE: 5000,
  // Cuentas de Discord más nuevas que esto no cuentan para premios (evita cuentas falsas)
  MIN_ACCOUNT_DAYS: 7,
  // Niveles: al llegar a esa cantidad de invitaciones (las que siguen en el servidor) se da el rol y el dinero
  TIERS: [
    { invites: 3, role: "📨 Reclutador", color: "#5dade2", money: 15000 },
    { invites: 5, role: "🥉 Embajador Bronce", color: "#cd7f32", money: 30000 },
    { invites: 10, role: "🥈 Embajador Plata", color: "#c0c0c0", money: 75000 },
    { invites: 25, role: "🥇 Embajador Oro", color: "#f1c40f", money: 200000 },
    { invites: 50, role: "💎 Embajador Diamante", color: "#48dbfb", money: 500000 },
    { invites: 100, role: "👑 Leyenda del Servidor", color: "#ff4f81", money: 1500000 },
  ],
};
