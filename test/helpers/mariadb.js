/*
 * Solo para pruebas en MariaDB: la base del servidor es MySQL 8, que entiende CAST(? AS JSON); MariaDB no. Si la base de
 * pruebas es MariaDB, se cambia por JSON_EXTRACT(?, '$') (mismo resultado) en las consultas del ODM.
 */
const mysql = require("../../src/database/mysql");

const fix = (sql) => (typeof sql === "string" ? sql.replace(/CAST\(\? AS JSON\)/g, () => "JSON_EXTRACT(?, '$')") : sql);
function wrap(target) {
  if (target.__mariadb) return target;
  const q = target.query.bind(target);
  target.query = (sql, ...rest) => q(fix(sql), ...rest);
  target.__mariadb = true;
  return target;
}

async function useMariaDbShim() {
  const pool = mysql.getPool();
  const [[{ v }]] = await pool.query("SELECT VERSION() AS v");
  if (!/mariadb/i.test(v)) return false;
  wrap(pool);
  const gc = pool.getConnection.bind(pool);
  if (!pool.__mariadbConn) {
    pool.getConnection = async () => wrap(await gc());
    pool.__mariadbConn = true;
  }
  return true;
}

module.exports = { useMariaDbShim };
