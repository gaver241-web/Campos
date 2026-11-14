// Constantes y ayudas del módulo Carwash

export const CATEGORIAS = [
  { id: 'auto', nombre: 'Auto / Sedán', corto: 'Auto', emoji: '🚗' },
  { id: 'suv', nombre: 'SUV / Camioneta', corto: 'SUV', emoji: '🚙' },
  { id: 'pickup', nombre: 'Pickup', corto: 'Pickup', emoji: '🛻' },
  { id: 'minivan', nombre: 'Miniván', corto: 'Miniván', emoji: '🚐' },
  { id: 'moto', nombre: 'Moto', corto: 'Moto', emoji: '🏍️' },
]

export const METODOS = ['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Tarjeta']

export const ESTADOS = {
  espera: 'En espera',
  lavado: 'En lavado',
  listo: 'Listo',
  terminado: 'Terminado',
}

export const PLANTILLAS_BASE = {
  ingreso: 'Hola {nombre}, recibimos tu vehículo {placa} en CARWASH CAMPOS. Sigue el avance aquí: {link}',
  listo: 'Hola {nombre}, tu vehículo {placa} ya está listo para recoger. ¡Gracias por elegirnos!',
  inactivo: 'Hola {nombre}, en CARWASH CAMPOS te extrañamos. Vuelve esta semana y te damos una sorpresa.',
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export const soles = (n) =>
  'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const catNombre = (id) => (CATEGORIAS.find((c) => c.id === id) || {}).corto || id
export const catEmoji = (id) => (CATEGORIAS.find((c) => c.id === id) || {}).emoji || '🚗'

export const hoy = () => new Date().toLocaleDateString('en-CA')
export const horaAhora = () => new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
export const fechaCorta = (iso) => {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}
export const sumarDias = (iso, n) => {
  const f = new Date(iso + 'T12:00:00')
  f.setDate(f.getDate() + n)
  return f.toLocaleDateString('en-CA')
}
export const diasEntre = (isoA, isoB) => Math.round((new Date(isoB + 'T12:00:00') - new Date(isoA + 'T12:00:00')) / 86400000)

export const normPlaca = (p) => (p || '').toUpperCase().replace(/\s+/g, '').trim()

export const rellenar = (texto, datos) =>
  (texto || '').replace(/\{(\w+)\}/g, (_, k) => (datos[k] !== undefined ? datos[k] : `{${k}}`))

export const urlSeguimiento = (placa) => `${window.location.origin}/#/carwash/estado/${encodeURIComponent(normPlaca(placa))}`

export const linkWhatsApp = (tel, texto) => {
  const n = (tel || '').replace(/\D/g, '')
  const num = n.length === 9 ? '51' + n : n
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
}

export function descargarCSV(nombre, filas) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = '\ufeff' + filas.map((f) => f.map(esc).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function comprimirImagen(file, max = 360, calidad = 0.55) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', calidad))
    }
    img.onerror = reject
    img.src = url
  })
}

// Datos de ejemplo opcionales (se cargan solo si el usuario lo pide en Configuración)
export function ejemplos() {
  const P = (a, s, p, m, mo) => ({ auto: a, suv: s, pickup: p, minivan: m, moto: mo })
  const servicios = [
    { id: uid(), nombre: 'Lavado básico', precios: P(15, 20, 22, 22, 8) },
    { id: uid(), nombre: 'Lavado completo', precios: P(25, 32, 35, 35, 12) },
    { id: uid(), nombre: 'Lavado de salón', precios: P(60, 80, 85, 90, 0) },
    { id: uid(), nombre: 'Lavado de motor', precios: P(20, 25, 28, 28, 12) },
    { id: uid(), nombre: 'Encerado', precios: P(30, 40, 45, 45, 15) },
    { id: uid(), nombre: 'Pulido', precios: P(150, 200, 220, 220, 70) },
  ]
  const combos = [
    { id: uid(), nombre: 'Combo Brillo Total', detalle: 'Lavado completo + Encerado', precios: P(49, 65, 72, 72, 24) },
  ]
  const productos = [
    { id: uid(), nombre: 'Ambientador', tipo: 'Venta', precio: 5, stock: 24, minimo: 10 },
    { id: uid(), nombre: 'Silicona para tablero', tipo: 'Venta', precio: 12, stock: 6, minimo: 8 },
    { id: uid(), nombre: 'Shampoo (litros)', tipo: 'Insumo', precio: 0, stock: 18, minimo: 10 },
  ]
  const maquinas = [
    { id: uid(), nombre: 'Hidrolavadora', tarea: 'Cambio de aceite', limite: 300, uso: 0 },
  ]
  return { servicios, combos, productos, maquinas }
}
