const express = require("express");
const path = require("path");
const cors = require("cors");
const { MongoClient } = require("mongodb");

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
