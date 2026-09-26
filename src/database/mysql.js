const mysql = require("mysql2/promise");

let pool = null;

// Datos de conexión: MYSQL_URL (mysql://usuario:clave@host:puerto/base) o las variables MYSQL_* sueltas.
// Es la misma base de datos que usa el servidor de SA-MP (scriptfiles/srp_db.ini).
function config() {
  const common = {
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: parseInt(process.env.MYSQL_CONNECTIONS) || 5,
    enableKeepAlive: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    // Las fechas llegan como texto: la tabla bans usa '0000-00-00 00:00:00' y eso no cabe en un Date.
    dateStrings: true,
  };
  if (process.env.MYSQL_URL) return { uri: process.env.MYSQL_URL, ...common };
  return {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ...common,
  };
}

function getPool() {
  if (!pool) pool = mysql.createPool(config());
  return pool;
}

async function query(sql, params) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

async function close() {
  if (pool) {
    const p = pool;
    pool = null;
    await p.end();
  }
}

module.exports = { getPool, query, close };
