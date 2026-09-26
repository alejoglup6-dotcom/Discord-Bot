/*
 * Capa de datos compatible con mongoose, guardada en MySQL.
 *
 * Los modelos siguen escribiéndose igual que con mongoose (new Schema({...}) + model("nombre", Schema)) y el
 * resto del bot usa la misma API: find, findOne, findOneAndUpdate, findOneAndDelete, updateOne, deleteOne,
 * deleteMany, countDocuments, create, doc.save(), doc.deleteOne(), .lean(), .sort(), .limit(), .skip(),
 * .cache(), .exec() y los operadores $set, $inc, $push, $pull, $in, $lt, etc.
 *
 * Cada modelo es una tabla bot_<nombre> en la misma base de datos del servidor de SA-MP:
 *   id (autoincremental) · doc (JSON con el documento) · created_at · updated_at
 *   + una columna indexada k_<campo> por cada campo de texto usado como clave (Guild, User, guildID, ...)
 * Los filtros por igualdad sobre campos de texto se resuelven en SQL; el resto se comprueba en JavaScript.
 */
const ms = require("ms");
const { escape } = require("mysql2");
const db = require("./mysql");

const Mixed = "Mixed";
const TYPES = { String: String, Number: Number, Boolean: Boolean, Date: Date };
// Campos de texto que reciben columna indexada (los que el bot usa para buscar)
const INDEXED_KEYS = ["Guild", "guildID", "guildId", "User", "userID", "userId", "messageId", "Channel", "Action"];

// ---------------------------------------------------------------------------------------------------------------
// Esquemas

function isPlainObject(v) {
  return v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
}

function parseType(t) {
  if (t === String) return { kind: "String" };
  if (t === Number) return { kind: "Number" };
  if (t === Boolean) return { kind: "Boolean" };
  if (t === Date) return { kind: "Date" };
  if (t === Array) return { kind: "Array", of: null };
  if (Array.isArray(t)) return { kind: "Array", of: t.length ? parseField(t[0]) : null };
  if (t === Object || t === Mixed || t === undefined) return { kind: "Mixed" };
  if (typeof t === "string" && TYPES[t]) return parseType(TYPES[t]);
  if (t instanceof Schema) return { kind: "Nested", tree: t.tree };
  if (isPlainObject(t)) return Object.keys(t).length ? { kind: "Nested", tree: compile(t) } : { kind: "Mixed" };
  return { kind: "Mixed" };
}

function parseField(def) {
  if (isPlainObject(def) && "type" in def && !isPlainObject(def.type)) {
    const spec = parseType(def.type);
    if ("default" in def) {
      spec.hasDefault = true;
      spec.default = def.default;
    }
    return spec;
  }
  if (isPlainObject(def) && "type" in def) {
    const spec = parseType(def.type);
    if ("default" in def) {
      spec.hasDefault = true;
      spec.default = def.default;
    }
    return spec;
  }
  return parseType(def);
}

function compile(def) {
  const tree = {};
  for (const key of Object.keys(def)) tree[key] = parseField(def[key]);
  return tree;
}

class Schema {
  constructor(definition = {}, options = {}) {
    this.definition = definition;
    this.options = options;
    this.tree = compile(definition);
  }
}
Schema.Types = { Mixed, String, Number, Boolean, Date, Array, ObjectId: String };

function defaultValue(spec) {
  if (spec.hasDefault) {
    const d = typeof spec.default === "function" ? spec.default() : spec.default;
    if (d instanceof Date) return new Date(d.getTime());
    return d === undefined ? undefined : cast(spec, clone(d));
  }
  if (spec.kind === "Array") return [];
  return undefined;
}

// Rellena los valores por defecto que falten (mongoose también lo hace al cargar documentos antiguos)
function applyDefaults(tree, obj) {
  for (const key of Object.keys(tree)) {
    const spec = tree[key];
    if (spec.kind === "Nested") {
      if (obj[key] === undefined) {
        const sub = {};
        applyDefaults(spec.tree, sub);
        if (Object.keys(sub).length) obj[key] = sub;
      } else if (isPlainObject(obj[key])) {
        applyDefaults(spec.tree, obj[key]);
      }
      continue;
    }
    if (obj[key] === undefined) {
      const d = defaultValue(spec);
      if (d !== undefined) obj[key] = d;
    }
  }
  return obj;
}

// Conversión de tipos como la de mongoose (numero -> texto, "5" -> 5, "true" -> true, texto -> Date...)
function cast(spec, value) {
  if (value === null || value === undefined || !spec) return value;
  switch (spec.kind) {
    case "String":
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
      if (value instanceof Date) return value.toISOString();
      if (Array.isArray(value) && value.length === 1) return cast(spec, value[0]);
      if (typeof value === "object" && typeof value.toString === "function" && value.toString !== Object.prototype.toString) return value.toString();
      return value;
    case "Number": {
      if (typeof value === "number") return value;
      if (typeof value === "boolean") return value ? 1 : 0;
      if (value instanceof Date) return value.getTime();
      if (typeof value === "string" && value.trim() !== "" && !isNaN(Number(value))) return Number(value);
      return value;
    }
    case "Boolean":
      if (typeof value === "boolean") return value;
      if (value === "true" || value === 1 || value === "1" || value === "yes") return true;
      if (value === "false" || value === 0 || value === "0" || value === "no") return false;
      return value;
    case "Date": {
      if (value instanceof Date) return value;
      if (value && typeof value === "object" && value.$date) value = value.$date;
      const d = new Date(value);
      return isNaN(d.getTime()) ? value : d;
    }
    case "Array":
      if (!Array.isArray(value)) value = [value];
      return spec.of ? value.map((v) => cast(spec.of, v)) : value;
    case "Nested":
      return isPlainObject(value) ? castTree(spec.tree, value) : value;
    default:
      return value;
  }
}

// Solo guarda los campos del esquema (modo estricto de mongoose)
function castTree(tree, obj) {
  const out = {};
  for (const key of Object.keys(tree)) {
    if (obj[key] === undefined) continue;
    out[key] = cast(tree[key], obj[key]);
  }
  return out;
}

function clone(v) {
  if (v === null || typeof v !== "object") return v;
  if (v instanceof Date) return new Date(v.getTime());
  if (Array.isArray(v)) return v.map(clone);
  if (v instanceof Document) return v.toObject();
  const out = {};
  for (const k of Object.keys(v)) out[k] = clone(v[k]);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Rutas con puntos ("a.b.c")

function getPath(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (Array.isArray(cur) && !/^\d+$/.test(p)) {
      const vals = cur.map((el) => (el == null ? undefined : el[p])).filter((v) => v !== undefined);
      return vals.length ? vals : undefined;
    }
    cur = cur[p];
  }
  return cur;
}

function setPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] === null || typeof cur[parts[i]] !== "object") cur[parts[i]] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function unsetPath(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur === null || typeof cur !== "object") return;
    cur = cur[parts[i]];
  }
  if (cur !== null && typeof cur === "object") delete cur[parts[parts.length - 1]];
}

function specForPath(tree, path) {
  const parts = path.split(".");
  let t = tree;
  let spec = null;
  for (const p of parts) {
    if (!t) return null;
    spec = t[p];
    if (!spec) return null;
    t = spec.kind === "Nested" ? spec.tree : null;
  }
  return spec;
}

// ---------------------------------------------------------------------------------------------------------------
// Filtros estilo MongoDB (evaluados en JavaScript)

function comparable(v) {
  if (v instanceof Date) return v.getTime();
  return v;
}

function valueEquals(a, b) {
  if (b instanceof RegExp) return typeof a === "string" && b.test(a);
  a = comparable(a);
  b = comparable(b);
  if (a === b) return true;
  if (a === undefined && b === null) return true;
  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") return JSON.stringify(a) === JSON.stringify(b);
  return false;
}

function fieldEquals(value, cond) {
  if (Array.isArray(value) && !Array.isArray(cond)) return value.some((v) => valueEquals(v, cond));
  return valueEquals(value, cond);
}

function compare(value, cond, fn) {
  const test = (v) => v !== undefined && v !== null && fn(comparable(v), comparable(cond));
  return Array.isArray(value) ? value.some(test) : test(value);
}

function matchOperators(value, ops, doc) {
  for (const op of Object.keys(ops)) {
    const c = ops[op];
    switch (op) {
      case "$eq":
        if (!fieldEquals(value, c)) return false;
        break;
      case "$ne":
        if (fieldEquals(value, c)) return false;
        break;
      case "$gt":
        if (!compare(value, c, (a, b) => a > b)) return false;
        break;
      case "$gte":
        if (!compare(value, c, (a, b) => a >= b)) return false;
        break;
      case "$lt":
        if (!compare(value, c, (a, b) => a < b)) return false;
        break;
      case "$lte":
        if (!compare(value, c, (a, b) => a <= b)) return false;
        break;
      case "$in":
        if (!c.some((x) => fieldEquals(value, x))) return false;
        break;
      case "$nin":
        if (c.some((x) => fieldEquals(value, x))) return false;
        break;
      case "$exists":
        if ((value !== undefined) !== Boolean(c)) return false;
        break;
      case "$regex": {
        const re = c instanceof RegExp ? c : new RegExp(c, ops.$options || "");
        if (!(Array.isArray(value) ? value : [value]).some((v) => typeof v === "string" && re.test(v))) return false;
        break;
      }
      case "$options":
        break;
      case "$size":
        if (!Array.isArray(value) || value.length !== c) return false;
        break;
      case "$all":
        if (!Array.isArray(value) || !c.every((x) => value.some((v) => valueEquals(v, x)))) return false;
        break;
      case "$elemMatch":
        if (!Array.isArray(value) || !value.some((el) => (isPlainObject(el) ? matches(el, c) : matchOperators(el, c)))) return false;
        break;
      case "$not":
        if (c instanceof RegExp ? fieldEquals(value, c) : matchOperators(value, c, doc)) return false;
        break;
      default:
        throw new Error(`Operador de consulta no soportado: ${op}`);
    }
  }
  return true;
}

function isOperatorObject(v) {
  return isPlainObject(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => k.startsWith("$"));
}

function matches(doc, filter) {
  if (!filter) return true;
  for (const key of Object.keys(filter)) {
    const cond = filter[key];
    if (key === "$or") {
      if (!cond.some((f) => matches(doc, f))) return false;
      continue;
    }
    if (key === "$and") {
      if (!cond.every((f) => matches(doc, f))) return false;
      continue;
    }
    if (key === "$nor") {
      if (cond.some((f) => matches(doc, f))) return false;
      continue;
    }
    if (key === "_id" || key === "id") {
      const id = isOperatorObject(cond) ? cond : String(cond);
      if (isOperatorObject(id) ? !matchOperators(String(doc._id), mapIds(id)) : String(doc._id) !== id) return false;
      continue;
    }
    const value = getPath(doc, key);
    if (isOperatorObject(cond)) {
      if (!matchOperators(value, cond, doc)) return false;
    } else if (!fieldEquals(value, cond)) return false;
  }
  return true;
}

// Convierte los valores del filtro al tipo del esquema, como mongoose ({ Guild: 123 } busca "123")
function castFilter(tree, filter) {
  if (!isPlainObject(filter)) return filter || {};
  const out = {};
  for (const key of Object.keys(filter)) {
    const cond = filter[key];
    if (key === "$or" || key === "$and" || key === "$nor") {
      out[key] = Array.isArray(cond) ? cond.map((f) => castFilter(tree, f)) : cond;
      continue;
    }
    let spec = key.startsWith("$") ? null : specForPath(tree, key);
    if (spec && spec.kind === "Array") spec = spec.of;
    if (!spec || spec.kind === "Mixed" || spec.kind === "Nested") {
      out[key] = cond;
      continue;
    }
    if (isOperatorObject(cond)) {
      const ops = {};
      for (const op of Object.keys(cond)) {
        const v = cond[op];
        if (["$eq", "$ne", "$gt", "$gte", "$lt", "$lte"].includes(op)) ops[op] = cast(spec, v);
        else if ((op === "$in" || op === "$nin" || op === "$all") && Array.isArray(v)) ops[op] = v.map((x) => (x instanceof RegExp ? x : cast(spec, x)));
        else ops[op] = v;
      }
      out[key] = ops;
    } else if (cond instanceof RegExp || Array.isArray(cond)) out[key] = cond;
    else out[key] = cast(spec, cond);
  }
  return out;
}

function mapIds(ops) {
  const out = {};
  for (const k of Object.keys(ops)) out[k] = Array.isArray(ops[k]) ? ops[k].map(String) : String(ops[k]);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Operadores de actualización ($set, $inc, $push, ...)

function isUpdateOperators(update) {
  return Object.keys(update).some((k) => k.startsWith("$"));
}

function applyUpdate(obj, update, isInsert) {
  if (!update) return obj;
  if (Array.isArray(update)) throw new Error("Las actualizaciones con pipeline no están soportadas");
  if (update instanceof Document) update = update.toObject();
  if (!isUpdateOperators(update)) update = { $set: update };
  for (const op of Object.keys(update)) {
    const fields = update[op] || {};
    for (const path of Object.keys(fields)) {
      if (path === "_id") continue;
      const v = fields[path];
      switch (op) {
        case "$set":
          if (v === undefined) unsetPath(obj, path);
          else setPath(obj, path, clone(v));
          break;
        case "$setOnInsert":
          if (isInsert) setPath(obj, path, clone(v));
          break;
        case "$unset":
          unsetPath(obj, path);
          break;
        case "$inc": {
          const cur = Number(getPath(obj, path)) || 0;
          setPath(obj, path, cur + Number(v));
          break;
        }
        case "$mul": {
          const cur = Number(getPath(obj, path)) || 0;
          setPath(obj, path, cur * Number(v));
          break;
        }
        case "$min": {
          const cur = getPath(obj, path);
          if (cur === undefined || comparable(v) < comparable(cur)) setPath(obj, path, clone(v));
          break;
        }
        case "$max": {
          const cur = getPath(obj, path);
          if (cur === undefined || comparable(v) > comparable(cur)) setPath(obj, path, clone(v));
          break;
        }
        case "$push":
        case "$addToSet": {
          let arr = getPath(obj, path);
          if (!Array.isArray(arr)) {
            arr = [];
            setPath(obj, path, arr);
          }
          const items = isPlainObject(v) && "$each" in v ? v.$each : [v];
          for (const item of items) {
            if (op === "$addToSet" && arr.some((x) => valueEquals(x, item))) continue;
            arr.push(clone(item));
          }
          break;
        }
        case "$pull": {
          const arr = getPath(obj, path);
          if (!Array.isArray(arr)) break;
          const keep = arr.filter((x) =>
            isOperatorObject(v) ? !matchOperators(x, v) : isPlainObject(v) && isPlainObject(x) ? !matches(x, v) : !valueEquals(x, v),
          );
          setPath(obj, path, keep);
          break;
        }
        case "$pullAll": {
          const arr = getPath(obj, path);
          if (Array.isArray(arr)) setPath(obj, path, arr.filter((x) => !v.some((y) => valueEquals(x, y))));
          break;
        }
        case "$pop": {
          const arr = getPath(obj, path);
          if (Array.isArray(arr)) v === -1 ? arr.shift() : arr.pop();
          break;
        }
        case "$rename": {
          const cur = getPath(obj, path);
          if (cur !== undefined) {
            unsetPath(obj, path);
            setPath(obj, v, cur);
          }
          break;
        }
        case "$currentDate":
          setPath(obj, path, new Date());
          break;
        default:
          throw new Error(`Operador de actualización no soportado: ${op}`);
      }
    }
  }
  return obj;
}

// Valores fijos del filtro que se copian al crear con upsert ({ Guild: "1", User: { $eq: "2" } })
function equalityFields(filter) {
  const out = {};
  if (!filter) return out;
  for (const key of Object.keys(filter)) {
    if (key.startsWith("$") || key === "_id") continue;
    const cond = filter[key];
    if (isOperatorObject(cond)) {
      if ("$eq" in cond) setPath(out, key, clone(cond.$eq));
    } else if (!(cond instanceof RegExp)) setPath(out, key, clone(cond));
  }
  if (Array.isArray(filter.$and)) for (const f of filter.$and) Object.assign(out, equalityFields(f));
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Orden

function parseSort(sort) {
  if (!sort) return [];
  const dir = (d) => (d === -1 || d === "-1" || d === "desc" || d === "descending" ? -1 : 1);
  if (typeof sort === "string") {
    return sort
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => (s.startsWith("-") ? [s.slice(1), -1] : [s, 1]));
  }
  if (Array.isArray(sort)) return sort.map((s) => (Array.isArray(s) ? [s[0], dir(s[1])] : [s, 1]));
  return Object.keys(sort).map((k) => [k, dir(sort[k])]);
}

function compareForSort(a, b) {
  a = comparable(a);
  b = comparable(b);
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  return a < b ? -1 : 1;
}

function sortDocs(docs, sort) {
  const keys = parseSort(sort);
  if (!keys.length) return docs;
  return docs.sort((x, y) => {
    for (const [k, d] of keys) {
      const c = compareForSort(k === "_id" ? Number(x._id) : getPath(x, k), k === "_id" ? Number(y._id) : getPath(y, k));
      if (c) return c * d;
    }
    return 0;
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Caché en memoria para .cache("60 seconds") (antes lo hacía ts-cache-mongoose)

const cacheStore = new Map();
const MAX_CACHE_ENTRIES = 5000;

function cacheGet(key) {
  const e = cacheStore.get(key);
  if (!e) return undefined;
  if (e.expires < Date.now()) {
    cacheStore.delete(key);
    return undefined;
  }
  return e.value;
}

function cacheSet(key, value, ttl) {
  if (cacheStore.size >= MAX_CACHE_ENTRIES) cacheStore.delete(cacheStore.keys().next().value);
  cacheStore.set(key, { value, expires: Date.now() + ttl });
}

function cacheInvalidate(table) {
  for (const key of cacheStore.keys()) if (key.startsWith(table + "|")) cacheStore.delete(key);
}

// ---------------------------------------------------------------------------------------------------------------
// Consultas encadenables (Model.find(...).sort(...).lean().exec())

class Query {
  constructor(model, op, filter, update, options) {
    this.model = model;
    this.op = op;
    this.filter = filter || {};
    this.update = update;
    this.options = { ...(options || {}) };
    this._lean = Boolean(this.options.lean);
    this._cacheTtl = 0;
  }
  lean(v = true) {
    this._lean = Boolean(v);
    return this;
  }
  sort(s) {
    this.options.sort = s;
    return this;
  }
  limit(n) {
    this.options.limit = n;
    return this;
  }
  skip(n) {
    this.options.skip = n;
    return this;
  }
  where(field, value) {
    if (isPlainObject(field)) Object.assign(this.filter, field);
    else if (value !== undefined) this.filter[field] = value;
    return this;
  }
  select() {
    return this;
  }
  populate() {
    return this;
  }
  session() {
    return this;
  }
  setOptions(o) {
    Object.assign(this.options, o);
    return this;
  }
  cache(ttl = "60 seconds") {
    this._cacheTtl = typeof ttl === "number" ? ttl * 1000 : ms(String(ttl)) || 60000;
    return this;
  }
  exec() {
    return this.model._run(this);
  }
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
  catch(reject) {
    return this.exec().catch(reject);
  }
  finally(fn) {
    return this.exec().finally(fn);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Documentos

const STATE = Symbol("state");

class Document {
  constructor(obj = {}, _state) {
    const tree = this.constructor.schema ? this.constructor.schema.tree : {};
    Object.defineProperty(this, STATE, {
      value: { isNew: true, id: null, original: {} },
      enumerable: false,
      writable: true,
    });
    Object.defineProperty(this, "_id", {
      enumerable: false,
      get: () => this[STATE].id,
      set: () => {},
    });
    Object.defineProperty(this, "id", {
      enumerable: false,
      get: () => (this[STATE].id === null ? null : String(this[STATE].id)),
      set: () => {},
    });
    if (_state) Object.assign(this[STATE], _state);
    const data = obj instanceof Document ? obj.toObject() : obj || {};
    const casted = castTree(tree, data);
    applyDefaults(tree, casted);
    Object.assign(this, casted);
  }

  get isNew() {
    return this[STATE].isNew;
  }
  set isNew(v) {
    this[STATE].isNew = Boolean(v);
  }

  get(path) {
    return getPath(this, path);
  }
  set(path, value) {
    if (isPlainObject(path)) {
      for (const k of Object.keys(path)) setPath(this, k, path[k]);
    } else setPath(this, path, value);
    return this;
  }
  markModified() {}
  isModified() {
    return true;
  }
  $isEmpty(path) {
    const v = getPath(this, path);
    return v === undefined || v === null || (typeof v === "object" && Object.keys(v).length === 0);
  }
  toObject() {
    const out = clone(castTree(this.constructor.schema.tree, this));
    if (this[STATE].id !== null) out._id = this[STATE].id;
    return out;
  }
  toJSON() {
    return this.toObject();
  }

  async save() {
    const model = this.constructor;
    await model.init();
    const data = castTree(model.schema.tree, this);
    Object.assign(this, data);
    const st = this[STATE];
    if (st.isNew) {
      const res = await db.query(`INSERT INTO \`${model.table}\` (doc) VALUES (CAST(? AS JSON))`, [JSON.stringify(data)]);
      st.id = res.insertId;
      st.isNew = false;
    } else {
      // Solo se escriben los campos que cambiaron, como hace mongoose: dos partes del bot pueden
      // cambiar campos distintos del mismo documento a la vez sin pisarse.
      const sets = [];
      const removes = [];
      const keys = new Set([...Object.keys(data), ...Object.keys(st.original)]);
      for (const k of keys) {
        const now = data[k] === undefined ? undefined : JSON.stringify(data[k]);
        if (now === st.original[k]) continue;
        if (now === undefined) removes.push(k);
        else sets.push([k, now]);
      }
      if (sets.length || removes.length) {
        let expr = "doc";
        const params = [];
        if (removes.length) {
          expr = `JSON_REMOVE(${expr}${", ?".repeat(removes.length)})`;
          for (const k of removes) params.push(jsonPath(k));
        }
        if (sets.length) {
          expr = `JSON_SET(${expr}${", ?, CAST(? AS JSON)".repeat(sets.length)})`;
          for (const [k, v] of sets) params.push(jsonPath(k), v);
        }
        params.push(st.id);
        const res = await db.query(`UPDATE \`${model.table}\` SET doc = ${expr} WHERE id = ?`, params);
        if (!res.affectedRows) {
          // El documento se borró mientras tanto: se vuelve a crear
          const ins = await db.query(`INSERT INTO \`${model.table}\` (doc) VALUES (CAST(? AS JSON))`, [JSON.stringify(data)]);
          st.id = ins.insertId;
        }
      }
    }
    st.original = snapshot(data);
    cacheInvalidate(model.table);
    return this;
  }

  async deleteOne() {
    const model = this.constructor;
    if (this[STATE].id !== null) {
      await model.init();
      await db.query(`DELETE FROM \`${model.table}\` WHERE id = ?`, [this[STATE].id]);
      cacheInvalidate(model.table);
    }
    return this;
  }
  remove() {
    return this.deleteOne();
  }
  async updateOne(update, options) {
    return this.constructor.updateOne({ _id: this[STATE].id }, update, options);
  }
}

function jsonPath(key) {
  return `$."${String(key).replace(/(["\\])/g, "\\$1")}"`;
}

function snapshot(data) {
  const out = {};
  for (const k of Object.keys(data)) if (data[k] !== undefined) out[k] = JSON.stringify(data[k]);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Modelos

const models = {};

function tableName(name) {
  return "bot_" + String(name).toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

function model(name, schema) {
  if (models[name]) {
    if (!schema) return models[name];
    throw new Error(`El modelo "${name}" ya existe`);
  }
  if (!schema) throw new Error(`El modelo "${name}" no existe`);
  if (!(schema instanceof Schema)) schema = new Schema(schema);

  const table = tableName(name);
  const indexed = INDEXED_KEYS.filter((k) => schema.tree[k] && schema.tree[k].kind === "String");

  class Model extends Document {}
  Object.defineProperty(Model, "name", { value: name });
  Model.modelName = name;
  Model.schema = schema;
  Model.table = table;
  Model.collection = { name: table, collectionName: table };
  Model.indexedKeys = indexed;
  Model.db = db;

  let ready = null;
  Model.init = function () {
    if (!ready) {
      ready = ensureTable(table, indexed).catch((err) => {
        ready = null;
        throw err;
      });
    }
    return ready;
  };

  Model.hydrate = function (row) {
    const doc = typeof row.doc === "string" ? JSON.parse(row.doc) : row.doc || {};
    const d = new Model(doc, { isNew: false, id: Number(row.id) });
    d[STATE].original = snapshot(castTree(schema.tree, doc));
    return d;
  };

  // Traduce a SQL lo que se puede (igualdad y $in sobre campos de texto); lo demás se filtra en JS.
  function buildWhere(filter) {
    const clauses = [];
    const params = [];
    let complete = true;
    for (const key of Object.keys(filter || {})) {
      const cond = filter[key];
      if (key === "_id" || key === "id") {
        if (!isOperatorObject(cond) && cond !== undefined && cond !== null && /^\d+$/.test(String(cond))) {
          clauses.push("id = ?");
          params.push(Number(cond));
        } else if (isOperatorObject(cond) && Object.keys(cond).length === 1 && Array.isArray(cond.$in) && cond.$in.every((v) => /^\d+$/.test(String(v)))) {
          if (!cond.$in.length) clauses.push("0");
          else {
            clauses.push(`id IN (${cond.$in.map(() => "?").join(",")})`);
            params.push(...cond.$in.map(Number));
          }
        } else complete = false;
        continue;
      }
      const spec = key.startsWith("$") ? null : specForPath(schema.tree, key);
      if (!spec || spec.kind !== "String" || key.includes(".")) {
        complete = false;
        continue;
      }
      const col = indexed.includes(key) ? `\`k_${key.toLowerCase()}\`` : `JSON_UNQUOTE(JSON_EXTRACT(doc, ${escape(jsonPath(key))}))`;
      const check = indexed.includes(key) ? "" : ` AND JSON_TYPE(JSON_EXTRACT(doc, ${escape(jsonPath(key))})) = 'STRING'`;
      const tooLong = (v) => indexed.includes(key) && v.length > 191;
      if ((typeof cond === "string" && tooLong(cond)) || (isOperatorObject(cond) && Array.isArray(cond.$in) && cond.$in.some((v) => typeof v === "string" && tooLong(v)))) {
        complete = false;
        continue;
      }
      if (typeof cond === "string") {
        clauses.push(`${col} = ?${check}`);
        params.push(cond);
      } else if (typeof cond === "number" || typeof cond === "boolean") {
        clauses.push(`${col} = ?${check}`);
        params.push(String(cond));
      } else if (isOperatorObject(cond) && Object.keys(cond).length === 1 && typeof cond.$eq === "string") {
        clauses.push(`${col} = ?${check}`);
        params.push(cond.$eq);
      } else if (isOperatorObject(cond) && Object.keys(cond).length === 1 && Array.isArray(cond.$in) && cond.$in.every((v) => typeof v === "string")) {
        if (!cond.$in.length) clauses.push("0");
        else {
          clauses.push(`${col} IN (${cond.$in.map(() => "?").join(",")})${check}`);
          params.push(...cond.$in);
        }
      } else complete = false;
    }
    return { sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params, complete };
  }

  // Filas que cumplen el filtro, en orden. forUpdate bloquea las filas dentro de una transacción.
  async function selectRows(conn, filter, options = {}, forUpdate = false) {
    await Model.init();
    const w = buildWhere(filter);
    const sortKeys = parseSort(options.sort);
    let sql = `SELECT id, doc FROM \`${table}\` ${w.sql} ORDER BY id`;
    const canLimit = w.complete && !sortKeys.length;
    if (canLimit && options.limit) sql += ` LIMIT ${parseInt(options.limit) + (parseInt(options.skip) || 0)}`;
    if (forUpdate) sql += " FOR UPDATE";
    const [rows] = await conn.query(sql, w.params);
    let docs = rows.map((r) => ({ row: r, obj: toPlain(r) }));
    if (!w.complete) docs = docs.filter((d) => matches(d.obj, filter));
    if (sortKeys.length) {
      const order = sortDocs(docs.map((d) => d.obj), options.sort);
      const byObj = new Map(docs.map((d) => [d.obj, d]));
      docs = order.map((o) => byObj.get(o));
    }
    const skip = parseInt(options.skip) || 0;
    if (skip) docs = docs.slice(skip);
    if (options.limit) docs = docs.slice(0, parseInt(options.limit));
    return docs.map((d) => d.row);
  }

  function toPlain(row) {
    const doc = typeof row.doc === "string" ? JSON.parse(row.doc) : row.doc || {};
    const out = applyDefaults(schema.tree, castTree(schema.tree, doc));
    out._id = Number(row.id);
    return out;
  }

  function output(rows, lean) {
    return rows.map((r) => (lean ? toPlain(r) : Model.hydrate(r)));
  }

  async function withTransaction(fn) {
    await Model.init();
    for (let attempt = 1; ; attempt++) {
      const conn = await db.getPool().getConnection();
      try {
        await conn.beginTransaction();
        const result = await fn(conn);
        await conn.commit();
        return result;
      } catch (err) {
        await conn.rollback().catch(() => {});
        // Dos actualizaciones del mismo documento a la vez: MySQL cancela una y se repite
        if ((err.code === "ER_LOCK_DEADLOCK" || err.code === "ER_LOCK_WAIT_TIMEOUT") && attempt < 4) continue;
        throw err;
      } finally {
        conn.release();
      }
    }
  }

  function prepareDoc(obj) {
    return applyDefaults(schema.tree, castTree(schema.tree, obj));
  }

  async function updateRows(filter, update, options, many) {
    const result = await withTransaction(async (conn) => {
      const rows = await selectRows(conn, filter, many ? { sort: options.sort } : { sort: options.sort, limit: 1 }, true);
      if (!rows.length) {
        if (!options.upsert) return { before: null, after: null, matched: 0, modified: 0, upserted: null };
        const base = equalityFields(filter);
        applyUpdate(base, update, true);
        const doc = prepareDoc(base);
        const json = JSON.stringify(doc);
        const [res] = await conn.query(`INSERT INTO \`${table}\` (doc) VALUES (CAST(? AS JSON))`, [json]);
        return { before: null, after: { id: res.insertId, doc: json }, matched: 0, modified: 0, upserted: res.insertId };
      }
      let modified = 0;
      let first = null;
      for (const row of rows) {
        const before = typeof row.doc === "string" ? JSON.parse(row.doc) : row.doc;
        const obj = clone(before);
        applyUpdate(obj, update, false);
        const doc = castTree(schema.tree, obj);
        const json = JSON.stringify(doc);
        if (json !== JSON.stringify(castTree(schema.tree, before))) {
          await conn.query(`UPDATE \`${table}\` SET doc = CAST(? AS JSON) WHERE id = ?`, [json, row.id]);
          modified++;
        }
        if (!first) first = { before: row, after: { id: row.id, doc: json } };
      }
      return { ...first, matched: rows.length, modified, upserted: null };
    });
    if (result.modified || result.upserted) cacheInvalidate(table);
    return result;
  }

  Model._run = async function (q) {
    const { op, filter, options } = q;
    const lean = q._lean;
    let cacheKey = null;
    if (q._cacheTtl && (op === "find" || op === "findOne" || op === "countDocuments")) {
      cacheKey = `${table}|${op}|${JSON.stringify(filter)}|${JSON.stringify(parseSort(options.sort))}|${options.skip || 0}|${options.limit || 0}`;
      const hit = cacheGet(cacheKey);
      if (hit !== undefined) return op === "countDocuments" ? hit : op === "findOne" ? (hit ? output([hit], lean)[0] : null) : output(hit, lean);
    }

    switch (op) {
      case "find": {
        const rows = await selectRows(db.getPool(), filter, options);
        if (cacheKey) cacheSet(cacheKey, rows, q._cacheTtl);
        return output(rows, lean);
      }
      case "findOne": {
        const rows = await selectRows(db.getPool(), filter, { ...options, limit: 1 });
        if (cacheKey) cacheSet(cacheKey, rows[0] || null, q._cacheTtl);
        return rows.length ? output(rows, lean)[0] : null;
      }
      case "countDocuments": {
        const rows = await selectRows(db.getPool(), filter, {});
        if (cacheKey) cacheSet(cacheKey, rows.length, q._cacheTtl);
        return rows.length;
      }
      case "exists": {
        const rows = await selectRows(db.getPool(), filter, { limit: 1 });
        return rows.length ? { _id: Number(rows[0].id) } : null;
      }
      case "findOneAndUpdate": {
        const r = await updateRows(filter, q.update, options, false);
        const wantNew = options.new === true || options.returnDocument === "after" || options.returnOriginal === false;
        const row = wantNew ? r.after : r.before;
        return row ? output([row], lean)[0] : null;
      }
      case "updateOne":
      case "updateMany": {
        const r = await updateRows(filter, q.update, options, op === "updateMany");
        return {
          acknowledged: true,
          matchedCount: r.matched,
          modifiedCount: r.modified,
          upsertedCount: r.upserted ? 1 : 0,
          upsertedId: r.upserted,
        };
      }
      case "findOneAndDelete":
      case "deleteOne":
      case "deleteMany": {
        const rows = await selectRows(db.getPool(), filter, op === "deleteMany" ? {} : { sort: options.sort, limit: 1 });
        if (rows.length) {
          await db.query(`DELETE FROM \`${table}\` WHERE id IN (?)`, [rows.map((r) => r.id)]);
          cacheInvalidate(table);
        }
        if (op === "findOneAndDelete") return rows.length ? output(rows, lean)[0] : null;
        return { acknowledged: true, deletedCount: rows.length };
      }
      default:
        throw new Error(`Operación no soportada: ${op}`);
    }
  };

  // Métodos estáticos (API de mongoose)
  const q = (op, filter, update, options) => new Query(Model, op, castFilter(schema.tree, filter), update, options);
  Model.find = (filter, _projection, options) => q("find", filter, null, options);
  Model.findOne = (filter, _projection, options) => q("findOne", filter, null, options);
  Model.findById = (id, _projection, options) => q("findOne", { _id: id }, null, options);
  Model.findOneAndUpdate = (filter, update, options) => q("findOneAndUpdate", filter, update, options);
  Model.findByIdAndUpdate = (id, update, options) => q("findOneAndUpdate", { _id: id }, update, options);
  Model.findOneAndDelete = (filter, options) => q("findOneAndDelete", filter, null, options);
  Model.findOneAndRemove = Model.findOneAndDelete;
  Model.findByIdAndDelete = (id, options) => q("findOneAndDelete", { _id: id }, null, options);
  Model.findByIdAndRemove = Model.findByIdAndDelete;
  Model.updateOne = (filter, update, options) => q("updateOne", filter, update, options);
  Model.updateMany = (filter, update, options) => q("updateMany", filter, update, options);
  Model.replaceOne = (filter, doc, options) => q("updateOne", filter, doc, options);
  Model.deleteOne = (filter, options) => q("deleteOne", filter, null, options);
  Model.deleteMany = (filter, options) => q("deleteMany", filter, null, options);
  Model.remove = Model.deleteMany;
  Model.countDocuments = (filter) => q("countDocuments", filter);
  Model.estimatedDocumentCount = () => q("countDocuments", {});
  Model.exists = (filter) => q("exists", filter);
  Model.where = (field, value) => q("find", {}).where(field, value);
  Model.create = async function (docs, ...rest) {
    if (rest.length && !Array.isArray(docs)) docs = [docs, ...rest];
    if (Array.isArray(docs)) {
      const out = [];
      for (const d of docs) out.push(await new Model(d).save());
      return out;
    }
    return new Model(docs).save();
  };
  Model.insertMany = async (docs) => Model.create(Array.isArray(docs) ? docs : [docs]);

  models[name] = Model;
  return Model;
}

async function ensureTable(table, indexed) {
  const cols = indexed
    .map(
      (k) =>
        `\`k_${k.toLowerCase()}\` VARCHAR(191) GENERATED ALWAYS AS (LEFT(JSON_UNQUOTE(JSON_EXTRACT(doc, '${jsonPath(k)}')), 191)) VIRTUAL, INDEX \`i_${k.toLowerCase()}\` (\`k_${k.toLowerCase()}\`),`,
    )
    .join("\n  ");
  await db.query(
    `CREATE TABLE IF NOT EXISTS \`${table}\` (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  doc JSON NOT NULL,
  ${cols}
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
  );
  // Tablas creadas con una versión anterior del esquema: añadir las columnas indexadas que falten
  const existing = await db.query(
    "SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    [table],
  );
  const have = new Set(existing.map((r) => r.c));
  for (const k of indexed) {
    const col = `k_${k.toLowerCase()}`;
    if (have.has(col)) continue;
    await db.query(
      `ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` VARCHAR(191) GENERATED ALWAYS AS (LEFT(JSON_UNQUOTE(JSON_EXTRACT(doc, '${jsonPath(k)}')), 191)) VIRTUAL, ADD INDEX \`i_${k.toLowerCase()}\` (\`${col}\`)`,
    );
  }
}

async function connect() {
  await db.query("SELECT 1");
  await Promise.all(Object.values(models).map((m) => m.init()));
}

async function ping() {
  const start = Date.now();
  await db.query("SELECT 1");
  return Date.now() - start;
}

module.exports = {
  Schema,
  Mixed,
  Types: Schema.Types,
  model,
  models,
  connect,
  ping,
  close: db.close,
  db,
  // exportado para pruebas
  _internal: { matches, applyUpdate, parseSort, cast },
};
