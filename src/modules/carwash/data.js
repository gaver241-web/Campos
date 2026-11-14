// DATOS DE EJEMPLO SOLO PARA EL DISEÑO (no se conecta a ningún servidor ni base de datos)

export const CATEGORIAS = [
  { id: 'auto', nombre: 'Auto / Sedán', corto: 'Auto', emoji: '🚗' },
  { id: 'suv', nombre: 'SUV / Camioneta', corto: 'SUV', emoji: '🚙' },
  { id: 'pickup', nombre: 'Pickup', corto: 'Pickup', emoji: '🛻' },
  { id: 'minivan', nombre: 'Miniván', corto: 'Miniván', emoji: '🚐' },
  { id: 'moto', nombre: 'Moto', corto: 'Moto', emoji: '🏍️' },
]

export const SERVICIOS = [
  { id: 's1', nombre: 'Lavado básico', precios: { auto: 15, suv: 20, pickup: 22, minivan: 22, moto: 8 } },
  { id: 's2', nombre: 'Lavado completo', precios: { auto: 25, suv: 32, pickup: 35, minivan: 35, moto: 12 } },
  { id: 's3', nombre: 'Lavado de salón', precios: { auto: 60, suv: 80, pickup: 85, minivan: 90, moto: 0 } },
  { id: 's4', nombre: 'Lavado de motor', precios: { auto: 20, suv: 25, pickup: 28, minivan: 28, moto: 12 } },
  { id: 's5', nombre: 'Encerado', precios: { auto: 30, suv: 40, pickup: 45, minivan: 45, moto: 15 } },
  { id: 's6', nombre: 'Pulido', precios: { auto: 150, suv: 200, pickup: 220, minivan: 220, moto: 70 } },
]

export const COMBOS = [
  { id: 'c1', nombre: 'Combo Brillo Total', incluye: ['Lavado completo', 'Encerado'], precio: 49, ahorro: 6 },
  { id: 'c2', nombre: 'Combo Salón + Motor', incluye: ['Lavado de salón', 'Lavado de motor'], precio: 70, ahorro: 10 },
  { id: 'c3', nombre: 'Combo Premium', incluye: ['Lavado completo', 'Salón', 'Encerado'], precio: 105, ahorro: 20 },
]

export const PRODUCTOS = [
  { id: 'p1', nombre: 'Ambientador', tipo: 'Venta', stock: 24, minimo: 10, precio: 5 },
  { id: 'p2', nombre: 'Silicona para tablero', tipo: 'Venta', stock: 6, minimo: 8, precio: 12 },
  { id: 'p3', nombre: 'Agua mineral', tipo: 'Venta', stock: 30, minimo: 12, precio: 2 },
  { id: 'p4', nombre: 'Shampoo (litros)', tipo: 'Insumo', stock: 18, minimo: 10, precio: 0 },
  { id: 'p5', nombre: 'Cera líquida (litros)', tipo: 'Insumo', stock: 3, minimo: 5, precio: 0 },
  { id: 'p6', nombre: 'Desengrasante (litros)', tipo: 'Insumo', stock: 9, minimo: 6, precio: 0 },
]

export const ORDENES_INICIALES = [
  { id: 'o1', placa: 'ABC-123', cat: 'auto', servicio: 'Lavado completo', hora: '08:10', estado: 'espera' },
  { id: 'o2', placa: 'V4K-892', cat: 'suv', servicio: 'Salón + Motor', hora: '08:25', estado: 'espera' },
  { id: 'o3', placa: 'D7P-410', cat: 'pickup', servicio: 'Lavado básico', hora: '07:50', estado: 'lavado' },
  { id: 'o4', placa: 'B2Z-006', cat: 'auto', servicio: 'Brillo Total', hora: '07:30', estado: 'lavado' },
  { id: 'o5', placa: '4521-MX', cat: 'moto', servicio: 'Lavado completo', hora: '07:15', estado: 'listo' },
]

export const CLIENTES = [
  { id: 'k1', nombre: 'Luis Paredes', tel: '987654321', placas: ['ABC-123'], visitas: 4, gasto: 420, ultima: 3, marca: 'Toyota Yaris' },
  { id: 'k2', nombre: 'María Torres', tel: '956123789', placas: ['V4K-892', 'C8M-331'], visitas: 6, gasto: 910, ultima: 1, marca: 'Hyundai Tucson' },
  { id: 'k3', nombre: 'Transportes El Sol', tel: '944100200', placas: ['D7P-410', 'D7P-411', 'D7P-420'], visitas: 18, gasto: 1860, ultima: 5, marca: 'Flota · Hilux', credito: true },
  { id: 'k4', nombre: 'Jorge Quispe', tel: '921334455', placas: ['B2Z-006'], visitas: 2, gasto: 98, ultima: 19, marca: 'Kia Rio' },
  { id: 'k5', nombre: 'Rosa Vega', tel: '989001122', placas: ['F9T-775'], visitas: 3, gasto: 210, ultima: 27, marca: 'Suzuki Swift' },
  { id: 'k6', nombre: 'Carlos Ñahui', tel: '930445566', placas: ['4521-MX'], visitas: 5, gasto: 140, ultima: 2, marca: 'Honda XR150' },
]

export const HISTORIAL = [
  { fecha: '10 nov', servicio: 'Lavado completo', monto: 25 },
  { fecha: '27 oct', servicio: 'Lavado básico', monto: 15 },
  { fecha: '09 oct', servicio: 'Brillo Total', monto: 49 },
]

export const CITAS = [
  { id: 'a1', hora: '09:00', dur: 2, placa: 'V4K-892', cliente: 'María Torres', servicio: 'Pulido', cat: 'suv' },
  { id: 'a2', hora: '11:30', dur: 3, placa: 'F9T-775', cliente: 'Rosa Vega', servicio: 'Tratamiento cerámico', cat: 'auto' },
  { id: 'a3', hora: '15:00', dur: 1.5, placa: 'C8M-331', cliente: 'María Torres', servicio: 'Lavado de salón', cat: 'auto' },
]

export const MAQUINAS = [
  { id: 'm1', nombre: 'Hidrolavadora Karcher', uso: 262, limite: 300, tarea: 'Cambio de aceite' },
  { id: 'm2', nombre: 'Aspiradora industrial', uso: 140, limite: 250, tarea: 'Revisar filtros' },
  { id: 'm3', nombre: 'Compresora', uso: 296, limite: 300, tarea: 'Revisión de empaques' },
]

export const CUENTAS = [
  { id: 'x1', cliente: 'Transportes El Sol', detalle: '12 lavados · quincena 1', monto: 186, dias: 9 },
  { id: 'x2', cliente: 'Taxi Lima Express', detalle: '7 lavados · quincena 1', monto: 98, dias: 4 },
]

export const EGRESOS = [
  { id: 'g1', concepto: 'Compra de shampoo y cera', cat: 'Insumos', monto: 85, fecha: 'Hoy' },
  { id: 'g2', concepto: 'Recibo de agua', cat: 'Servicios', monto: 120, fecha: 'Ayer' },
  { id: 'g3', concepto: 'Mantenimiento hidrolavadora', cat: 'Mantenimiento', monto: 60, fecha: '11 nov' },
]

export const SEMANA = [
  { d: 'Lun', v: 320 }, { d: 'Mar', v: 410 }, { d: 'Mié', v: 280 }, { d: 'Jue', v: 520 },
  { d: 'Vie', v: 610 }, { d: 'Sáb', v: 790 }, { d: 'Dom', v: 450 },
]

export const TOP_SERVICIOS = [
  { n: 'Lavado completo', c: 48 }, { n: 'Lavado básico', c: 35 }, { n: 'Brillo Total', c: 22 }, { n: 'Salón', c: 14 },
]

export const soles = (n) => 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const catNombre = (id) => (CATEGORIAS.find((c) => c.id === id) || {}).corto || id
export const catEmoji = (id) => (CATEGORIAS.find((c) => c.id === id) || {}).emoji || '🚗'
