/*
 * Llamadas a APIs de terceros para los comandos (fotos de animales, datos curiosos, memes, COVID, Minecraft...).
 * Antes, si la API fallaba, el comando no contestaba y Discord mostraba "La aplicación no respondió" (11-oct-2026).
 * Aqui: tiempo maximo, un reintento si el fallo es pasajero (red, 429, 5xx) y un error claro para mostrar al usuario.
 */
const UA = "Mozilla/5.0 (compatible; SampCityBot/1.0; +https://sampcity.app)";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function pedir(url, { method = "GET", headers = {}, body, timeout = 12000, intentos = 2, tipo = "json" } = {}) {
  let ultimo = null;
  for (let i = 0; i < intentos; i++) {
    if (i) await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch(url, { method, headers: { "User-Agent": UA, Accept: "application/json, text/plain, */*", ...headers }, body, signal: AbortSignal.timeout(timeout) });
      if (res.status === 429 || res.status >= 500) {
        ultimo = new ApiError(`el servicio externo está caído o saturado (respondió ${res.status})`, res.status);
        continue;
      }
      if (!res.ok) throw new ApiError(`el servicio externo respondió ${res.status}`, res.status);
      return tipo === "texto" ? await res.text() : await res.json();
    } catch (e) {
      if (e instanceof ApiError) throw e;
      ultimo = new ApiError(e.name === "TimeoutError" ? "el servicio externo no contestó a tiempo" : "no se pudo conectar con el servicio externo");
    }
  }
  throw ultimo;
}

const pedirJson = (url, opciones) => pedir(url, { ...opciones, tipo: "json" });
const pedirTexto = (url, opciones) => pedir(url, { ...opciones, tipo: "texto" });

// Respuesta de error estandar para un comando que depende de una API externa
function errorApi(client, interaction, e, que = "eso") {
  return client.errNormal({ error: `No pude traer ${que}: ${e.message}. Prueba de nuevo en un rato.`, type: "editreply" }, interaction);
}

module.exports = { pedirJson, pedirTexto, errorApi, ApiError };
