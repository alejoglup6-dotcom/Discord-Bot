/*
 * Motor de IA con respaldo automático entre proveedores gratis (todos usan el formato de OpenAI).
 *
 * chat(messages) prueba los proveedores en orden y, si uno falla (límite 429, key mala, modelo retirado,
 * caída o demora), pasa al siguiente sin que el usuario note nada. Lo que falla se "enfría" un tiempo
 * para no volver a golpearlo en cada mensaje.
 *
 * Keys en el .env:  GROQ_KEY · GEMINI_KEY · CEREBRAS_KEY · OPENROUTER_KEY   (y opcionales: MISTRAL_KEY · NVIDIA_KEY)
 * Los modelos gratis cambian seguido: se pueden reemplazar sin tocar el código con  <PROVEEDOR>_MODELS="modelo1,modelo2"
 * (ej. GROQ_MODELS="llama-3.3-70b-versatile,openai/gpt-oss-120b"). El orden de proveedores: IA_ORDEN="groq,gemini,..."
 *
 * Imágenes: chatVision(messages) usa la misma cadena pero solo con modelos que VEN imágenes. Cada proveedor tiene su lista
 * propia:  GEMINI_VISION_MODELS · GROQ_VISION_MODELS · OPENROUTER_VISION_MODELS · MISTRAL_VISION_MODELS · NVIDIA_VISION_MODELS
 * (Cerebras no tiene; se salta). Los nombres de modelos con visión cambian seguido: si uno falla con 404 se descarta solo.
 */
const TIMEOUT_MS = parseInt(process.env.IA_TIMEOUT) || 25000;
const MAX_TOKENS = parseInt(process.env.IA_MAX_TOKENS) || 700;
// Con imágenes la petición es más pesada y los modelos tardan más: tiempo propio (IA_VISION_TIMEOUT, en ms)
const VISION_TIMEOUT_MS = parseInt(process.env.IA_VISION_TIMEOUT) || 60000;
// Temperatura por defecto (charla). Para preguntas del servidor iaChat pasa IA_TEMP (más baja = inventa menos).
const DEFAULT_TEMP = Number.isFinite(parseFloat(process.env.IA_TEMP_CHARLA)) ? parseFloat(process.env.IA_TEMP_CHARLA) : 0.7;

const list = (value, fallback) => {
  const items = String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
};

const providers = [
  {
    id: "groq",
    name: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: () => process.env.GROQ_KEY,
    models: () => list(process.env.GROQ_MODELS, ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"]),
    // llama-4-scout fue retirado por Groq (jul 2026): sin defecto; ponlo en el .env si Groq publica uno nuevo con visión
    visionModels: () => list(process.env.GROQ_VISION_MODELS, []),
  },
  {
    id: "gemini",
    name: "Google Gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    key: () => process.env.GEMINI_KEY,
    // Los alias "-latest" evitan que el modelo se vuelva obsoleto (Google retiró gemini-2.0-flash)
    models: () => list(process.env.GEMINI_MODELS, ["gemini-flash-latest", "gemini-flash-lite-latest"]),
    // los modelos Flash de Gemini son multimodales: sirven los mismos para imágenes
    visionModels: () => list(process.env.GEMINI_VISION_MODELS, ["gemini-flash-latest", "gemini-flash-lite-latest"]),
  },
  {
    id: "cerebras",
    name: "Cerebras",
    url: "https://api.cerebras.ai/v1/chat/completions",
    key: () => process.env.CEREBRAS_KEY,
    models: () => list(process.env.CEREBRAS_MODELS, ["gpt-oss-120b", "llama-3.3-70b", "llama3.1-8b"]),
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    key: () => process.env.OPENROUTER_KEY,
    headers: { "X-Title": "Discord Bot" },
    models: () =>
      list(process.env.OPENROUTER_MODELS, [
        "meta-llama/llama-3.3-70b-instruct:free",
        "openai/gpt-oss-120b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "openrouter/free",
      ]),
    // sin defecto: "openrouter/free" puede caer en un modelo de seguridad (responde "User Safety: safe"). Pon uno concreto en el .env
    visionModels: () => list(process.env.OPENROUTER_VISION_MODELS, []),
  },
  {
    id: "mistral",
    name: "Mistral",
    url: "https://api.mistral.ai/v1/chat/completions",
    key: () => process.env.MISTRAL_KEY,
    models: () => list(process.env.MISTRAL_MODELS, ["mistral-small-latest"]),
    visionModels: () => list(process.env.MISTRAL_VISION_MODELS, ["mistral-small-latest"]),
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    key: () => process.env.NVIDIA_KEY,
    models: () => list(process.env.NVIDIA_MODELS, ["meta/llama-3.3-70b-instruct"]),
    visionModels: () => list(process.env.NVIDIA_VISION_MODELS, []), // sin defecto: ponlo en el .env si tienes uno
  },
];

// Estado en memoria: hasta cuándo no se usa un proveedor / modelo
const providerBlocked = new Map(); // id -> { until, reason }
const modelBlocked = new Map(); // "id:modelo" -> { until, reason }
const stats = new Map(); // id -> { ok, fail, last }

const now = () => Date.now();
const isBlocked = (map, key) => {
  const b = map.get(key);
  if (!b) return false;
  if (b.until <= now()) {
    map.delete(key);
    return false;
  }
  return true;
};
const block = (map, key, ms, reason) => map.set(key, { until: now() + ms, reason });
const bump = (id, field, extra = {}) => {
  const s = stats.get(id) || { ok: 0, fail: 0, last: null };
  s[field]++;
  Object.assign(s, extra);
  stats.set(id, s);
};

function orderedProviders() {
  const order = list(process.env.IA_ORDEN, providers.map((p) => p.id));
  const byId = new Map(providers.map((p) => [p.id, p]));
  const sorted = order.map((id) => byId.get(id)).filter(Boolean);
  // los que no aparecen en IA_ORDEN van al final
  for (const p of providers) if (!sorted.includes(p)) sorted.push(p);
  return sorted.filter((p) => String(p.key() || "").trim());
}

function retryAfterMs(res, bodyText) {
  const header = parseFloat(res.headers?.get?.("retry-after"));
  if (Number.isFinite(header) && header > 0) return Math.min(header * 1000, 60 * 60 * 1000);
  // Gemini avisa cuánto esperar dentro del cuerpo: "retryDelay": "35s"
  const delay = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(bodyText || "");
  if (delay) return Math.min(parseFloat(delay[1]) * 1000 + 1000, 60 * 60 * 1000);
  // límite diario: no tiene sentido reintentar en un minuto
  if (/per ?day|daily|diari|RPD/i.test(bodyText || "")) return 30 * 60 * 1000;
  return 60 * 1000;
}

// Modelos de seguridad (Llama Guard, Nemotron Safety...) no conversan: responden solo "User Safety: safe" o "safe/unsafe"
const GUARD_REPLY = /^\s*(user safety\s*:|response safety\s*:|(very |un)?safe\b[\s\S]{0,40}$)/i;

function cleanReply(text) {
  return String(text || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "") // modelos que "piensan en voz alta"
    .trim();
}

async function callModel(provider, model, messages, temperature = DEFAULT_TEMP, timeoutMs = TIMEOUT_MS, maxTokens = MAX_TOKENS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${String(provider.key()).trim()}`,
        ...(provider.headers || {}),
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
      signal: controller.signal,
    });
    const raw = await res.text();
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {}
    return { res, raw, data };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Motor común: recorre proveedores y modelos con respaldo. `vision: true` usa solo modelos con visión.
 * @param {{role: "system"|"user"|"assistant", content: string|object[]}[]} messages
 */
async function run(messages, { temperature, vision = false, max_tokens } = {}) {
  let candidates = orderedProviders();
  if (vision) candidates = candidates.filter((p) => typeof p.visionModels === "function" && p.visionModels().length);
  if (!candidates.length) throw new Error("No hay ninguna key de IA en el .env (GROQ_KEY, GEMINI_KEY, CEREBRAS_KEY, OPENROUTER_KEY)");

  const errors = [];
  for (const provider of candidates) {
    if (isBlocked(providerBlocked, provider.id)) continue;

    for (const model of vision ? provider.visionModels() : provider.models()) {
      const mkey = `${provider.id}:${model}`;
      if (isBlocked(modelBlocked, mkey)) continue;

      let result;
      try {
        result = await callModel(provider, model, messages, temperature, vision ? VISION_TIMEOUT_MS : TIMEOUT_MS, Number(max_tokens) > 0 ? Number(max_tokens) : MAX_TOKENS);
      } catch (err) {
        // sin conexión, DNS o tiempo agotado: se salta todo el proveedor un rato
        const reason = err.name === "AbortError" ? "tiempo agotado" : err.message;
        block(providerBlocked, provider.id, 30 * 1000, reason);
        bump(provider.id, "fail", { last: reason });
        errors.push(`${provider.name}: ${reason}`);
        break;
      }

      const { res, raw, data } = result;
      const apiMessage = data?.error?.message || data?.message || raw.slice(0, 150);

      if (res.ok) {
        const text = cleanReply(data?.choices?.[0]?.message?.content);
        if (text && GUARD_REPLY.test(text)) {
          block(modelBlocked, mkey, 60 * 60 * 1000, "modelo de seguridad, no conversa");
          errors.push(`${provider.name}/${model}: modelo de seguridad`);
          continue;
        }
        if (text) {
          bump(provider.id, "ok", { last: null });
          return { text, provider: provider.name, model };
        }
        errors.push(`${provider.name}/${model}: respuesta vacía`);
        continue;
      }

      bump(provider.id, "fail", { last: `${res.status} ${apiMessage}`.slice(0, 120) });
      errors.push(`${provider.name}/${model}: ${res.status}`);

      if (res.status === 401 || res.status === 403) {
        // key inválida o sin permiso: no se insiste con este proveedor
        block(providerBlocked, provider.id, 60 * 60 * 1000, `key rechazada (${res.status})`);
        break;
      }
      if (res.status === 429) {
        block(modelBlocked, mkey, retryAfterMs(res, raw), "límite de uso");
        continue;
      }
      if (res.status === 404 || (res.status === 400 && /model|not found|does not exist|decommission|deprecat/i.test(apiMessage))) {
        // modelo retirado o con otro nombre: se descarta unas horas y se prueba el siguiente
        block(modelBlocked, mkey, 6 * 60 * 60 * 1000, "modelo no disponible");
        continue;
      }
      if (res.status >= 500 || res.status === 408) {
        block(modelBlocked, mkey, 30 * 1000, `error ${res.status}`);
        continue;
      }
      // 400 u otro: solo falla esta petición con este modelo
    }
  }

  const err = new Error(`Ningún proveedor respondió → ${errors.join(" | ") || "todos están en pausa"}`);
  err.allFailed = true;
  throw err;
}

/**
 * @param {{role: "system"|"user"|"assistant", content: string}[]} messages
 * @returns {Promise<{text: string, provider: string, model: string}>}
 */
const chat = (messages, opts = {}) => run(messages, { ...opts, vision: false });

/**
 * Igual que chat() pero para mensajes con imágenes. El contenido del usuario va como lista de partes:
 *   [{ type: "text", text: "..." }, { type: "image_url", image_url: { url: "data:image/png;base64,..." } }]
 * Usa visionPart(buffer, mime) para armar cada imagen. Si ningún proveedor con visión responde, lanza error con allFailed.
 */
const chatVision = (messages, opts = {}) => run(messages, { ...opts, vision: true });

/** Convierte una imagen descargada en la parte `image_url` (base64) que entienden todos los proveedores. */
const visionPart = (buffer, mime = "image/jpeg") => ({
  type: "image_url",
  image_url: { url: `data:${mime};base64,${Buffer.from(buffer).toString("base64")}` },
});

/** Estado de cada proveedor (para un futuro comando /iaestado). */
function status() {
  return providers.map((p) => {
    const hasKey = !!String(p.key() || "").trim();
    const blocked = providerBlocked.get(p.id);
    const s = stats.get(p.id) || { ok: 0, fail: 0, last: null };
    const modelsOut = p
      .models()
      .filter((m) => isBlocked(modelBlocked, `${p.id}:${m}`))
      .map((m) => ({ model: m, ...modelBlocked.get(`${p.id}:${m}`) }));
    return {
      id: p.id,
      name: p.name,
      hasKey,
      vision: typeof p.visionModels === "function" && p.visionModels().length > 0,
      paused: blocked && blocked.until > now() ? blocked : null,
      modelsOut,
      ok: s.ok,
      fail: s.fail,
      last: s.last,
    };
  });
}

module.exports = { chat, chatVision, visionPart, status, providers, _state: { providerBlocked, modelBlocked, stats } };
