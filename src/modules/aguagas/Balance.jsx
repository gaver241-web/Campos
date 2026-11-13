import { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'

function inRange(fechaISO, desde, hasta) {
  const f = new Date(fechaISO)
  return f >= desde && f <= hasta
}

function getRango(filtro, customDesde, customHasta) {
  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)

  if (filtro === 'dia') return [inicioHoy, finHoy]
  if (filtro === 'semana') {
    const inicio = new Date(inicioHoy)
    inicio.setDate(inicio.getDate() - inicio.getDay())
    return [inicio, finHoy]
  }
  if (filtro === 'mes') return [new Date(hoy.getFullYear(), hoy.getMonth(), 1), finHoy]
  if (filtro === 'anio') return [new Date(hoy.getFullYear(), 0, 1), finHoy]
  if (filtro === 'custom' && customDesde && customHasta) {
    return [new Date(customDesde), new Date(customHasta + 'T23:59:59')]
  }
  return [inicioHoy, finHoy]
}

export default function Balance() {
  const [ventas, setVentas] = useState([])
  const [productos, setProductos] = useState([])
  const [filtro, setFiltro] = useState('dia')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  useEffect(() => {
    api.getVentas().then(setVentas).catch(() => {})
    api.getProductos().then(setProductos).catch(() => {})
  }, [])

  const [rInicio, rFin] = getRango(filtro, desde, hasta)
  const ventasFiltradas = useMemo(
    () => ventas.filter(v => v.fecha && inRange(v.fecha, rInicio, rFin)),
    [ventas, filtro, desde, hasta]
  )

  const precioCompraPorId = Object.fromEntries(productos.map(p => [String(p.id), Number(p.precioCompra) || 0]))

  const totalVendido = ventasFiltradas.reduce((s, v) => s + (Number(v.montoPagado) || 0), 0)
  const cobradas = ventasFiltradas.filter(v => v.estado === 'Cobrado')
  const pendientes = ventasFiltradas.filter(v => v.estado === 'Por cobrar')
  const totalCobrado = cobradas.reduce((s, v) => s + (Number(v.montoPagado) || 0), 0)
  const totalPendiente = pendientes.reduce((s, v) => s + (Number(v.montoPagado) || 0), 0)
  const productosVendidos = ventasFiltradas.reduce((s, v) => s + (Number(v.cantidad) || 0), 0)
  const gananciaEstimada = ventasFiltradas.reduce((s, v) => {
    const costo = (precioCompraPorId[String(v.productoId)] || 0) * (Number(v.cantidad) || 0)
    return s + ((Number(v.montoPagado) || 0) - costo)
  }, 0)

  return (
    <>
      <header className="module-header">
        <div className="top-row">
          <div>
            <h2>Balance</h2>
            <p className="header-sub">Resumen financiero y ganancias</p>
          </div>
        </div>
      </header>

      <div className="tabs-bar">
        {[['dia', 'Hoy'], ['semana', 'Semana'], ['mes', 'Mes'], ['anio', 'Año'], ['custom', 'Por fechas']].map(([key, label]) => (
          <button key={key} className={filtro === key ? 'active' : ''} onClick={() => setFiltro(key)}>{label}</button>
        ))}
      </div>

      <div className="page-body">
        {filtro === 'custom' && (
          <div className="card">
            <div className="form-grid two-cols">
              <div className="form-row">
                <label>Desde</label>
                <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
              </div>
              <div className="form-row">
                <label>Hasta</label>
                <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="balance-grid">
          <div className="balance-card">
            <div className="etiqueta">Total vendido</div>
            <div className="monto">S/ {totalVendido.toFixed(2)}</div>
          </div>
          <div className="balance-card">
            <div className="etiqueta">Ganancia estimada</div>
            <div className="monto" style={{ color: 'var(--verde)' }}>S/ {gananciaEstimada.toFixed(2)}</div>
          </div>
          <div className="balance-card">
            <div className="etiqueta">Cobrado ({cobradas.length})</div>
            <div className="monto">S/ {totalCobrado.toFixed(2)}</div>
          </div>
          <div className="balance-card">
            <div className="etiqueta">Por cobrar ({pendientes.length})</div>
            <div className="monto" style={{ color: 'var(--rojo)' }}>S/ {totalPendiente.toFixed(2)}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Detalle de actividad</span>
          </div>
          <div className="list-item">
            <span style={{ color: 'var(--gris-texto)', fontWeight: 600 }}>Productos vendidos</span>
            <strong style={{ fontSize: 16 }}>{productosVendidos} unidades</strong>
          </div>
          <div className="list-item">
            <span style={{ color: 'var(--gris-texto)', fontWeight: 600 }}>N° de operaciones</span>
            <strong style={{ fontSize: 16 }}>{ventasFiltradas.length} ventas</strong>
          </div>
        </div>
      </div>
    </>
  )
}
