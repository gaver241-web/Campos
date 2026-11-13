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
  } catch (err) {
    console.error(`❌ Error conectando a MongoDB (intento ${intento}):`, err.message);
    setTimeout(() => connectDB(intento + 1), Math.min(30000, 5000 * intento));
  }
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));

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
