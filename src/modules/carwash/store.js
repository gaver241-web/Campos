import { useSyncExternalStore } from 'react'
import { PLANTILLAS_BASE, ejemplos, uid, hoy, horaAhora, normPlaca } from './data.js'

const KEY = 'carwash-campos:v1'
const PEND = 'carwash-campos:pendiente' // hay cambios locales que aún no llegaron a la base de datos
const API = '/api/carwash'
const COLS = ['servicios', 'combos', 'productos', 'clientes', 'ordenes', 'egresos', 'citas', 'maquinas', 'cierres']
const META = ['caja', 'correlativo', 'config']

const base = () => ({
  servicios: [],
  combos: [],
  productos: [],
  clientes: [],
  ordenes: [],
  egresos: [],
  citas: [],
  maquinas: [],
  cierres: [],
  caja: { abierta: false, inicial: 0, desde: 0 },
  correlativo: 0,
  config: {
    nombre: 'CARWASH CAMPOS',
    ruc: '',
    direccion: '',
    telefono: '',
    pie: '¡Limpieza que te hace brillar!',
    plantillas: { ...PLANTILLAS_BASE },
  },
})

function fusionar(guardado) {
  const b = base()
  const s = guardado || {}
  return {
    ...b,
    ...s,
    caja: { ...b.caja, ...(s.caja || {}) },
    config: { ...b.config, ...(s.config || {}), plantillas: { ...b.config.plantillas, ...((s.config || {}).plantillas || {}) } },
  }
}

function cargar() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return fusionar(JSON.parse(raw))
  } catch (e) { /* datos dañados: se empieza limpio */ }
  return base()
}

let estado = cargar()
const subs = new Set()

// ── Copia local (caché del navegador) ─────────────────────────
// La base de datos es la fuente de verdad; esto solo permite abrir rápido y trabajar sin internet.
let avisado = false
function guardarLocal() {
  try {
    localStorage.setItem(KEY, JSON.stringify(estado))
  } catch (e) {
    // Sin espacio: en la copia local (no en la base de datos) se omiten fotos y firmas de tickets antiguos
    try {
      const limite = Math.max(0, estado.ordenes.length - 8)
      const liviano = { ...estado, ordenes: estado.ordenes.map((o, i) => (i < limite ? { ...o, foto: null, fotosDanio: [], firma: null } : o)) }
      localStorage.setItem(KEY, JSON.stringify(liviano))
    } catch (e2) {
      if (!avisado) { avisado = true; console.warn('Carwash: no hay espacio en el navegador para la copia local; los datos siguen yendo a la base de datos.') }
    }
  }
}

// ── Sincronización con MongoDB ────────────────────────────────
let sincronizado = null // lo último que sabemos que está en la base de datos
let cargado = false
let enVuelo = false
let revServidor = 0
let timer = null
let estadoSync = 'cargando' // cargando | ok | pendiente | error
const subsSync = new Set()

function setSync(s) {
  if (estadoSync === s) return
  estadoSync = s
  subsSync.forEach((f) => f())
}

export function useSync() {
  return useSyncExternalStore(
    (cb) => { arrancar(); subsSync.add(cb); return () => subsSync.delete(cb) },
    () => estadoSync
  )
}

async function http(path, options) {
  const res = await fetch(API + path, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!res.ok) throw new Error('Error de red: ' + res.status)
  return res.json()
}

// Compara dos estados (por referencia: los cambios son inmutables) y devuelve solo lo que cambió
function diferencias(prev, next) {
  const up = {}
  const del = {}
  const meta = {}
  let hay = false
  for (const c of COLS) {
    const previos = new Map(prev[c].map((x) => [x.id, x]))
    const ids = new Set()
    for (const x of next[c]) {
      ids.add(x.id)
      if (previos.get(x.id) !== x) { (up[c] ||= []).push(x); hay = true }
    }
    for (const id of previos.keys()) if (!ids.has(id)) { (del[c] ||= []).push(id); hay = true }
  }
  for (const k of META) if (prev[k] !== next[k]) { meta[k] = next[k]; hay = true }
  return { hay, up, del, meta }
}

async function enviar({ up, del, meta }) {
  let rev = null
  const hayDel = Object.keys(del).length > 0
  const hayMeta = Object.keys(meta).length > 0
  if (hayDel || hayMeta) rev = (await http('/sync', { method: 'POST', body: JSON.stringify({ del, meta }) })).rev
  // Los tickets con fotos pesan: se mandan en tandas para no pasar el límite del servidor
  let tanda = {}
  let peso = 0
  const mandar = async () => {
    if (!Object.keys(tanda).length) return
    rev = (await http('/sync', { method: 'POST', body: JSON.stringify({ up: tanda }) })).rev
    tanda = {}
    peso = 0
  }
  for (const c of Object.keys(up)) {
    for (const item of up[c]) {
      const t = JSON.stringify(item).length
      if (peso + t > 4_000_000) await mandar()
      ;(tanda[c] ||= []).push(item)
      peso += t
    }
  }
  await mandar()
  return rev
}

function programar(ms) {
  clearTimeout(timer)
  timer = setTimeout(vaciarCola, ms)
}

async function vaciarCola() {
  if (!cargado || enVuelo) return
  const snap = estado
  const d = diferencias(sincronizado, snap)
  if (!d.hay) {
    if (snap === estado) { localStorage.removeItem(PEND); setSync('ok') }
    return
  }
  enVuelo = true
  try {
    const rev = await enviar(d)
    sincronizado = snap
    if (rev != null && rev === revServidor + 1) revServidor = rev // el cambio fue solo nuestro
    if (estado === snap) { localStorage.removeItem(PEND); setSync('ok') }
  } catch (e) {
    setSync('error')
    programar(8000)
    enVuelo = false
    return
  }
  enVuelo = false
  if (estado !== snap) programar(0) // hubo cambios mientras se enviaba
}

// Une lo del servidor con cambios locales que quedaron sin enviar (gana lo local)
function mezclar(srv, loc) {
  const out = { ...srv }
  for (const c of COLS) {
    const m = new Map(srv[c].map((x) => [x.id, x]))
    for (const x of loc[c]) m.set(x.id, x)
    out[c] = [...m.values()]
  }
  out.caja = loc.caja
  out.config = loc.config
  out.correlativo = Math.max(srv.correlativo, loc.correlativo)
  return out
}

function avisarCambio() {
  guardarLocal()
  subs.forEach((f) => f())
}

async function iniciar() {
  try {
    const srv = await http('/estado')
    const delServidor = fusionar({ ...srv.cols, ...srv.meta })
    revServidor = srv.rev || 0
    if (srv.vacio) {
      // Primera vez: lo que ya hay en este navegador se sube a la base de datos
      sincronizado = base()
    } else if (localStorage.getItem(PEND) === '1') {
      sincronizado = delServidor
      estado = mezclar(delServidor, estado)
    } else {
      sincronizado = delServidor
      estado = delServidor
    }
    cargado = true
    avisarCambio()
    await vaciarCola()
  } catch (e) {
    setSync('error')
    setTimeout(iniciar, 8000)
  }
}

// Trae los cambios que hicieron otros equipos (solo si no hay nada pendiente de enviar aquí)
async function refrescar() {
  if (!cargado || enVuelo || localStorage.getItem(PEND) === '1') return
  if (typeof document !== 'undefined' && document.hidden) return
  const antes = estado
  try {
    const srv = await http('/estado?rev=' + revServidor)
    if (srv.igual) { if (estadoSync === 'error') setSync('ok'); return }
    if (estado !== antes || enVuelo || localStorage.getItem(PEND) === '1') return
    const nuevo = fusionar({ ...srv.cols, ...srv.meta })
    revServidor = srv.rev || 0
    sincronizado = nuevo
    estado = nuevo
    avisarCambio()
    setSync('ok')
  } catch (e) { /* sin conexión: se reintenta en el siguiente ciclo */ }
}

// Arranca la sincronización solo cuando el panel la usa (la página pública de seguimiento no debe bajar los datos)
let arrancado = false
function arrancar() {
  if (arrancado || typeof window === 'undefined') return
  arrancado = true
  iniciar()
  setInterval(refrescar, 30000)
  window.addEventListener('focus', refrescar)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) vaciarCola()
    else refrescar()
  })
  window.addEventListener('online', () => { vaciarCola(); refrescar() })
}

function cambiar(fn) {
  estado = fn(estado)
  try { localStorage.setItem(PEND, '1') } catch (e) { /* sin espacio local: igual se sincroniza */ }
  avisarCambio()
  setSync(cargado ? 'pendiente' : 'cargando')
  if (cargado) programar(400)
}

export function useStore() {
  return useSyncExternalStore(
    (cb) => { arrancar(); subs.add(cb); return () => subs.delete(cb) },
    () => estado
  )
}

export const subtotalItems = (items) => (items || []).reduce((a, i) => a + Number(i.precio || 0) * Number(i.cant || 0), 0)
export const totalOrden = (o) => Math.max(0, subtotalItems(o.items) - Number(o.descuento || 0))

// Suma (signo = 1) o revierte (signo = -1) lo que pasa cuando el servicio queda terminado
function efectos(s, o, signo) {
  const total = totalOrden(o)
  const productos = s.productos.map((p) => {
    const gastado = (o.items || []).filter((i) => i.tipo === 'producto' && i.refId === p.id).reduce((a, i) => a + Number(i.cant || 0), 0)
    return gastado ? { ...p, stock: Number(p.stock || 0) - gastado * signo } : p
  })
  const placa = normPlaca(o.placa)
  const clientes = s.clientes.map((c) =>
    c.placas.map(normPlaca).includes(placa)
      ? { ...c, visitas: Math.max(0, (c.visitas || 0) + signo), gasto: Math.max(0, (c.gasto || 0) + total * signo) }
      : c
  )
  const maquinas = s.maquinas.map((m) => ({ ...m, uso: Math.max(0, Number(m.uso || 0) + signo) }))
  return { ...s, productos, clientes, maquinas }
}

function vincularCliente(clientes, data) {
  const placa = normPlaca(data.placa)
  const c = data.cliente || {}
  const nombre = (c.nombre || '').trim()
  if (!placa && !nombre) return clientes
  const existe = clientes.find((x) => placa && x.placas.map(normPlaca).includes(placa))
  if (existe) {
    return clientes.map((x) =>
      x.id === existe.id
        ? { ...x, nombre: nombre || x.nombre, tel: c.tel || x.tel, doc: c.doc || x.doc, marca: data.marca || x.marca }
        : x
    )
  }
  if (!nombre) return clientes
  return [...clientes, { id: uid(), nombre, tel: c.tel || '', doc: c.doc || '', correo: '', placas: placa ? [placa] : [], marca: data.marca || '', visitas: 0, gasto: 0, credito: false }]
}

export const acc = {
  guardar(col, item) {
    const nuevo = { ...item, id: item.id || uid() }
    cambiar((s) => ({
      ...s,
      [col]: s[col].some((x) => x.id === nuevo.id) ? s[col].map((x) => (x.id === nuevo.id ? nuevo : x)) : [...s[col], nuevo],
    }))
    return nuevo
  },
  borrar(col, id) {
    cambiar((s) => ({ ...s, [col]: s[col].filter((x) => x.id !== id) }))
  },
  ajustarStock(id, delta) {
    cambiar((s) => ({ ...s, productos: s.productos.map((p) => (p.id === id ? { ...p, stock: Math.max(0, Number(p.stock || 0) + delta) } : p)) }))
  },

  crearOrden(data) {
    let o
    cambiar((s) => {
      const numero = s.correlativo + 1
      o = { pagado: false, pagos: [], credito: false, efectos: false, ...data, id: uid(), numero, fecha: hoy(), hora: horaAhora(), ts: Date.now() }
      return { ...s, correlativo: numero, ordenes: [...s.ordenes, o], clientes: vincularCliente(s.clientes, data) }
    })
    return o
  },
  actualizarOrden(id, patch) {
    cambiar((s) => {
      const ordenes = s.ordenes.map((o) => (o.id === id ? { ...o, ...patch } : o))
      const nueva = ordenes.find((o) => o.id === id)
      return { ...s, ordenes, clientes: patch.cliente || patch.placa ? vincularCliente(s.clientes, nueva) : s.clientes }
    })
  },
  cambiarEstado(id, est) {
    cambiar((s) => ({ ...s, ordenes: s.ordenes.map((o) => (o.id === id ? { ...o, estado: est } : o)) }))
  },
  // Cobra el ticket: queda "terminado". Con credito=true se deja la deuda pendiente.
  terminar(id, { pagos = [], credito = false } = {}) {
    cambiar((s) => {
      const o = s.ordenes.find((x) => x.id === id)
      if (!o) return s
      let sig = s
      if (!o.efectos) sig = efectos(s, o, 1)
      const nuevo = credito
        ? { ...o, estado: 'terminado', credito: true, pagado: false, pagos: [], efectos: true, terminadoTs: Date.now() }
        : { ...o, estado: 'terminado', credito: false, pagado: true, pagos, efectos: true, fechaPago: hoy(), pagoTs: Date.now(), terminadoTs: Date.now() }
      return { ...sig, ordenes: sig.ordenes.map((x) => (x.id === id ? nuevo : x)) }
    })
  },
  cobrarCredito(id, pagos) {
    cambiar((s) => ({
      ...s,
      ordenes: s.ordenes.map((o) => (o.id === id ? { ...o, pagado: true, pagos, fechaPago: hoy(), pagoTs: Date.now() } : o)),
    }))
  },
  reabrirOrden(id) {
    cambiar((s) => {
      const o = s.ordenes.find((x) => x.id === id)
      if (!o) return s
      const sig = o.efectos ? efectos(s, o, -1) : s
      return {
        ...sig,
        ordenes: sig.ordenes.map((x) => (x.id === id ? { ...x, estado: 'listo', pagado: false, credito: false, pagos: [], efectos: false, fechaPago: null, pagoTs: null } : x)),
      }
    })
  },
  borrarOrden(id) {
    cambiar((s) => {
      const o = s.ordenes.find((x) => x.id === id)
      if (!o) return s
      const sig = o.efectos ? efectos(s, o, -1) : s
      return { ...sig, ordenes: sig.ordenes.filter((x) => x.id !== id) }
    })
  },

  abrirCaja(inicial) {
    cambiar((s) => ({ ...s, caja: { abierta: true, inicial: Number(inicial) || 0, desde: Date.now() } }))
  },
  cerrarCaja(cierre) {
    cambiar((s) => ({
      ...s,
      caja: { abierta: false, inicial: 0, desde: 0 },
      cierres: [{ ...cierre, id: uid(), fecha: hoy(), hora: horaAhora() }, ...s.cierres],
    }))
  },

  guardarConfig(cfg) {
    cambiar((s) => ({ ...s, config: { ...s.config, ...cfg } }))
  },
  cargarEjemplos() {
    cambiar((s) => ({ ...s, ...ejemplos() }))
  },
  vaciarTodo() {
    cambiar((s) => ({ ...base(), config: s.config }))
  },
  exportar() {
    return JSON.stringify(estado)
  },
  importar(texto) {
    const datos = JSON.parse(texto)
    if (!datos || typeof datos !== 'object' || !Array.isArray(datos.ordenes)) throw new Error('Archivo no válido')
    cambiar(() => fusionar(datos))
  },
  tamanoKB() {
    return Math.round(JSON.stringify(estado).length / 1024)
  },
}
