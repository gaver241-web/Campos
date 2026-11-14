import { useSyncExternalStore } from 'react'
import { PLANTILLAS_BASE, ejemplos, uid, hoy, horaAhora, normPlaca } from './data.js'

const KEY = 'carwash-campos:v1'

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
let avisado = false
const subs = new Set()

function guardar() {
  const intentar = () => localStorage.setItem(KEY, JSON.stringify(estado))
  try {
    intentar()
  } catch (e) {
    // Sin espacio: se quitan las fotos y firmas de los tickets más antiguos y se reintenta
    try {
      const ord = [...estado.ordenes]
      const limite = Math.max(0, ord.length - 8)
      estado = {
        ...estado,
        ordenes: ord.map((o, i) => (i < limite ? { ...o, foto: null, fotosDanio: [], firma: null } : o)),
      }
      intentar()
      if (!avisado) { avisado = true; alert('El espacio del navegador se está llenando. Se quitaron las fotos de tickets antiguos. Descarga un respaldo en Configuración.') }
    } catch (e2) {
      if (!avisado) { avisado = true; alert('No se pudo guardar: el navegador no tiene espacio. Descarga un respaldo en Configuración y libera espacio.') }
    }
  }
}

function cambiar(fn) {
  estado = fn(estado)
  guardar()
  subs.forEach((f) => f())
}

export function useStore() {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb) },
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
