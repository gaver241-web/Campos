const express = require("express");
const path = require("path");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3002;

// MongoDB Atlas (nube) - cluster propio de "campos", independiente del de gaveclean.
// La cadena de conexión va SOLO en variables de entorno (Hostinger → Variables de entorno).
const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || "campos";

let db;
let client;

// Colecciones del módulo Carwash (cada una se guarda en Mongo como "carwash_<nombre>")
const CW_COLS = ["servicios", "combos", "productos", "clientes", "ordenes", "egresos", "citas", "maquinas", "cierres"];

// Conecta a Atlas en segundo plano y reintenta si falla.
// El servidor ya está escuchando, así que Hostinger no lo marca como caído.
async function connectDB(intento = 1) {
  if (!MONGO_URL) {
    console.error("❌ Falta la variable de entorno MONGO_URL. Agrégala en Hostinger y reinicia la app.");
    return;
  }
  try {
    if (client) await client.close().catch(() => {});
    client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`✅ Conectado a MongoDB Atlas (${DB_NAME})`);
    for (const c of CW_COLS) await db.collection("carwash_" + c).createIndex({ id: 1 }).catch(() => {});
  } catch (err) {
    console.error(`❌ Error conectando a MongoDB (intento ${intento}):`, err.message);
    setTimeout(() => connectDB(intento + 1), Math.min(30000, 5000 * intento));
  }
}

app.use(cors());
app.use(express.json({ limit: "25mb" }));

// ── LOGIN (una sola cuenta para todo el sistema) ────────────
// La clave NO está en el código: aquí solo va su "hash". Para cambiarla sin tocar código,
// define en Hostinger la variable ADMIN_PASSWORD (y opcionalmente ADMIN_EMAIL / SESSION_SECRET).
app.set("trust proxy", 1);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "pierre39campos@gmail.com").trim().toLowerCase();
const ADMIN_HASH = "scrypt$4e39b1ee00d91692db7c1fcf7e048d3c$672f3cda39d61cb4f7b2b3e252ca32f24de9b58884917d9ae89bb5485340ca0f";
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.createHash("sha256").update((MONGO_URL || "") + ADMIN_HASH + (process.env.ADMIN_PASSWORD || "")).digest("hex");
const COOKIE = "campos_sesion";
const SESION_MS = 30 * 24 * 60 * 60 * 1000;

const igual = (a, b) => {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};
function claveCorrecta(pw) {
  if (process.env.ADMIN_PASSWORD) return igual(pw, process.env.ADMIN_PASSWORD);
  const [, salt, hash] = ADMIN_HASH.split("$");
  return igual(crypto.scryptSync(String(pw), salt, 32).toString("hex"), hash);
}
const firmar = (txt) => crypto.createHmac("sha256", SESSION_SECRET).update(txt).digest("base64url");
function crearToken(email) {
  const cuerpo = Buffer.from(JSON.stringify({ e: email, exp: Date.now() + SESION_MS })).toString("base64url");
  return cuerpo + "." + firmar(cuerpo);
}
function sesion(req) {
  const m = (req.headers.cookie || "").split(";").map((c) => c.trim()).find((c) => c.startsWith(COOKIE + "="));
  if (!m) return null;
  const [cuerpo, firma] = decodeURIComponent(m.slice(COOKIE.length + 1)).split(".");
  if (!cuerpo || !firma || !igual(firma, firmar(cuerpo))) return null;
  try {
    const d = JSON.parse(Buffer.from(cuerpo, "base64url").toString());
    return d.exp > Date.now() ? d : null;
  } catch { return null; }
}

// Freno a quien prueba claves: 8 fallos seguidos desde una IP = bloqueo de 15 minutos
const intentos = new Map();
app.post("/api/login", (req, res) => {
  const ip = req.ip;
  const reg = intentos.get(ip) || { n: 0, hasta: 0 };
  if (reg.hasta > Date.now()) return res.status(429).json({ error: "Demasiados intentos. Espera 15 minutos." });
  const { email = "", password = "" } = req.body || {};
  const ok = igual(String(email).trim().toLowerCase(), ADMIN_EMAIL) & claveCorrecta(password); // sin cortocircuito
  if (!ok) {
    reg.n += 1;
    if (reg.n >= 8) { reg.n = 0; reg.hasta = Date.now() + 15 * 60 * 1000; }
    intentos.set(ip, reg);
    return res.status(401).json({ error: "Correo o contraseña incorrectos" });
  }
  intentos.delete(ip);
  res.cookie(COOKIE, crearToken(ADMIN_EMAIL), { httpOnly: true, sameSite: "lax", secure: req.secure, maxAge: SESION_MS, path: "/" });
  res.json({ ok: true });
});
app.get("/api/me", (req, res) => {
  const s = sesion(req);
  if (!s) return res.status(401).json({ error: "No autorizado" });
  res.json({ ok: true, email: s.e });
});
app.post("/api/logout", (req, res) => {
  res.clearCookie(COOKIE, { path: "/" });
  res.json({ ok: true });
});

// Todo lo demás de la API exige sesión (menos el seguimiento público que abre el cliente desde su celular)
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/carwash/seguimiento/")) return next();
  if (sesion(req)) return next();
  res.status(401).json({ error: "No autorizado" });
});

// Si la base de datos aún no conectó, la API responde 503 en vez de romperse.
app.use("/api", (req, res, next) => {
  if (!db) return res.status(503).json({ error: "Base de datos no disponible, intenta en unos segundos" });
  next();
});
app.use(express.static(path.join(__dirname, "dist")));

function clean(doc) {
  const item = { ...doc };
  if (!item.id) item.id = doc._id.toString();
  delete item._id;
  return item;
}

// ── PRODUCTOS (agua-gas) ───────────────────────────────────
app.get("/api/aguagas/productos", async (req, res) => {
  try {
    const data = await db.collection("aguagas_productos").find({}).toArray();
    res.json(data.map(clean));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/aguagas/productos", async (req, res) => {
  try {
    const item = { id: Date.now(), ...req.body };
    await db.collection("aguagas_productos").insertOne(item);
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/api/aguagas/productos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.collection("aguagas_productos").updateOne({ id }, { $set: req.body });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/aguagas/productos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.collection("aguagas_productos").deleteOne({ id });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── COMPRAS (registrar compra actualiza stock) ─────────────
app.get("/api/aguagas/compras", async (req, res) => {
  try {
    const data = await db.collection("aguagas_compras").find({}).toArray();
    res.json(data.map(clean));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/aguagas/compras", async (req, res) => {
  try {
    const { nombre, cantidad, precioCompra, precioVenta, fecha } = req.body;
    const compra = { id: Date.now(), nombre, cantidad, precioCompra, precioVenta, fecha: fecha || new Date().toISOString() };
    await db.collection("aguagas_compras").insertOne(compra);

    const existente = await db.collection("aguagas_productos").findOne({ nombre });
    if (existente) {
      await db.collection("aguagas_productos").updateOne(
        { nombre },
        { $inc: { stock: cantidad }, $set: { precioCompra, precioVenta } }
      );
    } else {
      await db.collection("aguagas_productos").insertOne({
        id: Date.now() + 1,
        nombre,
        categoria: /gas/i.test(nombre) ? "gas" : /agua/i.test(nombre) ? "agua" : "otro",
        stock: cantidad,
        precioCompra,
        precioVenta,
      });
    }
    res.json(compra);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── VENTAS (descuenta stock) ────────────────────────────────
app.get("/api/aguagas/ventas", async (req, res) => {
  try {
    const data = await db.collection("aguagas_ventas").find({}).toArray();
    res.json(data.map(clean));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/aguagas/ventas", async (req, res) => {
  try {
    const item = { id: Date.now(), ...req.body };
    await db.collection("aguagas_ventas").insertOne(item);
    if (item.productoId) {
      await db.collection("aguagas_productos").updateOne(
        { id: parseInt(item.productoId) },
        { $inc: { stock: -(Number(item.cantidad) || 0) } }
      );
    }
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/api/aguagas/ventas/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.collection("aguagas_ventas").updateOne({ id }, { $set: req.body });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/aguagas/ventas/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.collection("aguagas_ventas").deleteOne({ id });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CARWASH ─────────────────────────────────────────────────
// Estado completo (al abrir la app). Con ?rev=N responde { igual: true } si no hubo cambios.
app.get("/api/carwash/estado", async (req, res) => {
  try {
    const meta = await db.collection("carwash_meta").findOne({ _id: "meta" });
    if (meta && req.query.rev !== undefined && String(meta.rev) === String(req.query.rev)) {
      return res.json({ igual: true });
    }
    const cols = {};
    let hayDatos = !!meta;
    for (const c of CW_COLS) {
      cols[c] = await db.collection("carwash_" + c).find({}, { projection: { _id: 0 } }).toArray();
      if (cols[c].length) hayDatos = true;
    }
    const datosMeta = {};
    if (meta) {
      for (const k of ["caja", "correlativo", "config"]) if (meta[k] !== undefined) datosMeta[k] = meta[k];
    }
    res.json({ vacio: !hayDatos, rev: meta ? meta.rev || 0 : 0, meta: datosMeta, cols });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Guarda cambios: up = { coleccion: [items] } (crea o reemplaza), del = { coleccion: [ids] }, meta = { caja, correlativo, config }
app.post("/api/carwash/sync", async (req, res) => {
  try {
    const { up = {}, del = {}, meta = {} } = req.body || {};
    for (const c of [...Object.keys(up), ...Object.keys(del)]) {
      if (!CW_COLS.includes(c)) return res.status(400).json({ error: "Colección no válida: " + c });
    }
    for (const c of Object.keys(up)) {
      const items = (up[c] || []).filter((x) => x && x.id);
      if (!items.length) continue;
      await db.collection("carwash_" + c).bulkWrite(
        items.map((item) => ({ replaceOne: { filter: { id: item.id }, replacement: item, upsert: true } }))
      );
    }
    for (const c of Object.keys(del)) {
      if (del[c] && del[c].length) await db.collection("carwash_" + c).deleteMany({ id: { $in: del[c] } });
    }
    const set = {};
    for (const k of ["caja", "correlativo", "config"]) if (meta[k] !== undefined) set[k] = meta[k];
    const update = { $inc: { rev: 1 } };
    if (Object.keys(set).length) update.$set = set;
    const doc = await db.collection("carwash_meta").findOneAndUpdate(
      { _id: "meta" }, update, { upsert: true, returnDocument: "after" }
    );
    res.json({ ok: true, rev: doc.rev });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Página pública de seguimiento: devuelve SOLO el servicio más reciente de esa placa (sin fotos ni datos del cliente)
app.get("/api/carwash/seguimiento/:placa", async (req, res) => {
  try {
    const placa = String(req.params.placa || "").toUpperCase().replace(/\s+/g, "");
    const [orden] = await db.collection("carwash_ordenes").aggregate([
      { $addFields: { _p: { $replaceAll: { input: { $toUpper: { $ifNull: ["$placa", ""] } }, find: " ", replacement: "" } } } },
      { $match: { _p: placa } },
      { $sort: { ts: -1 } },
      { $limit: 1 },
      { $project: { _id: 0, estado: 1, items: 1, descuento: 1, placa: 1 } },
    ]).toArray();
    const meta = await db.collection("carwash_meta").findOne({ _id: "meta" });
    const cfg = (meta && meta.config) || {};
    res.json({
      orden: orden || null,
      config: { nombre: cfg.nombre || "CARWASH CAMPOS", direccion: cfg.direccion || "", telefono: cfg.telefono || "" },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Fallback React (SPA) ────────────────────────────────────
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ── INICIAR ──────────────────────────────────────────────────
// Primero escucha el puerto (Hostinger lo exige en menos de 3 s) y luego conecta a la base.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Campos corriendo en puerto ${PORT}`);
});
connectDB();
