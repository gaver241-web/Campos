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
          <h2>Balance</h2>
        </div>
      </header>

      <div className="filtros-fecha">
        {[['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes'], ['anio', 'Año'], ['custom', 'Rango']].map(([key, label]) => (
          <button key={key} className={filtro === key ? 'active' : ''} onClick={() => setFiltro(key)}>{label}</button>
        ))}
      </div>

      {filtro === 'custom' && (
        <div className="page-content" style={{ paddingTop: 0, paddingBottom: 8 }}>
          <div className="card" style={{ display: 'flex', gap: 10 }}>
            <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
              <label>Desde</label>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
            </div>
            <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
              <label>Hasta</label>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      <div className="page-content">
        <div className="resumen-grid" style={{ padding: 0, gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <div className="etiqueta" style={{ fontSize: 12, color: '#6B8494' }}>Total vendido</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>S/ {totalVendido.toFixed(2)}</div>
          </div>
          <div className="card">
            <div className="etiqueta" style={{ fontSize: 12, color: '#6B8494' }}>Ganancia estimada</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--verde)' }}>S/ {gananciaEstimada.toFixed(2)}</div>
          </div>
          <div className="card">
            <div className="etiqueta" style={{ fontSize: 12, color: '#6B8494' }}>Cobrado ({cobradas.length})</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>S/ {totalCobrado.toFixed(2)}</div>
          </div>
          <div className="card">
            <div className="etiqueta" style={{ fontSize: 12, color: '#6B8494' }}>Por cobrar ({pendientes.length})</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--rojo)' }}>S/ {totalPendiente.toFixed(2)}</div>
          </div>
        </div>

        <div className="card">
          <div className="list-item">
            <strong>Productos vendidos</strong>
            <span style={{ fontWeight: 700 }}>{productosVendidos}</span>
          </div>
          <div className="list-item">
            <strong>N° de ventas</strong>
            <span style={{ fontWeight: 700 }}>{ventasFiltradas.length}</span>
          </div>
        </div>
      </div>
    </>
  )
}
